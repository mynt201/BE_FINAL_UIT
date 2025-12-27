import axios, { AxiosResponse } from 'axios';
import { logger } from '../../utils/logger';

interface OSMNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OSMWay {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

interface OSMRelation {
  type: 'relation';
  id: number;
  members: Array<{
    type: 'node' | 'way' | 'relation';
    ref: number;
    role: string;
  }>;
  tags?: Record<string, string>;
}

type OSMElement = OSMNode | OSMWay | OSMRelation;

interface OSMResponse {
  version: string;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: OSMElement[];
}

interface InfrastructureFeature {
  id: string;
  type: 'river' | 'road' | 'railway' | 'building' | 'water_body' | 'drainage';
  name?: string | undefined;
  coordinates: Array<[number, number]>;
  properties: Record<string, any>;
  osm_tags: Record<string, string>;
}

interface FloodInfrastructure {
  rivers: InfrastructureFeature[];
  water_bodies: InfrastructureFeature[];
  drainage_channels: InfrastructureFeature[];
  roads: InfrastructureFeature[];
  buildings: InfrastructureFeature[];
  flood_defenses: InfrastructureFeature[];
}

class OpenStreetMapService {
  private overpassUrl: string;
  private nominatimUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.overpassUrl = 'https://overpass-api.de/api/interpreter';
    this.nominatimUrl = 'https://nominatim.openstreetmap.org';
  }

  /**
   * Search for locations using Nominatim
   */
  async searchLocations(query: string, limit: number = 5): Promise<Array<{
    place_id: number;
    osm_id: number;
    osm_type: string;
    licence: string;
    lat: string;
    lon: string;
    class: string;
    type: string;
    place_rank: number;
    importance: number;
    addresstype: string;
    name: string;
    display_name: string;
    boundingbox: string[];
  }> | null> {
    try {
      const params = {
        q: query,
        format: 'json',
        limit: limit,
        countrycodes: 'VN', // Focus on Vietnam
        addressdetails: 1
      };

      logger.info(`Searching OSM locations for: ${query}`);
      const response: AxiosResponse<any[]> = await axios.get(`${this.nominatimUrl}/search`, { params });

      return response.data.map(location => ({
        place_id: location.place_id,
        osm_id: location.osm_id,
        osm_type: location.osm_type,
        licence: location.licence,
        lat: location.lat,
        lon: location.lon,
        class: location.class,
        type: location.type,
        place_rank: location.place_rank,
        importance: location.importance,
        addresstype: location.addresstype,
        name: location.name,
        display_name: location.display_name,
        boundingbox: location.boundingbox
      }));

    } catch (error: any) {
      logger.error(`Error searching OSM locations for ${query}:`, error.message);
      return null;
    }
  }

  /**
   * Get infrastructure data within a bounding box
   */
  async getInfrastructureData(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number
  ): Promise<FloodInfrastructure | null> {
    try {
      const cacheKey = `infra_${minLat}_${minLng}_${maxLat}_${maxLng}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Overpass QL query to get infrastructure relevant to flood risk
      const query = `
        [out:json][timeout:25];
        (
          // Rivers and waterways
          way["waterway"="river"](bbox:${minLat},${minLng},${maxLat},${maxLng});
          way["waterway"="stream"](bbox:${minLat},${minLng},${maxLat},${maxLng});
          way["waterway"="canal"](bbox:${minLat},${minLng},${maxLat},${maxLng});
          relation["waterway"="river"](bbox:${minLat},${minLng},${maxLat},${maxLng});

          // Water bodies
          way["natural"="water"](bbox:${minLat},${minLng},${maxLat},${maxLng});
          way["landuse"="reservoir"](bbox:${minLat},${minLng},${maxLat},${maxLng});
          way["water"="lake"](bbox:${minLat},${minLng},${maxLat},${maxLng});

          // Drainage infrastructure
          way["man_made"="drain"](bbox:${minLat},${minLng},${maxLat},${maxLng});
          way["waterway"="drain"](bbox:${minLat},${minLng},${maxLat},${maxLng});

          // Roads and transportation
          way["highway"]["highway"!~"footway|path|cycleway"](bbox:${minLat},${minLng},${maxLat},${maxLng});

          // Buildings
          way["building"](bbox:${minLat},${minLng},${maxLat},${maxLng});

          // Flood defenses
          way["man_made"="dyke"](bbox:${minLat},${minLng},${maxLat},${maxLng});
          way["man_made"="levee"](bbox:${minLat},${minLng},${maxLat},${maxLng});
          way["barrier"="flood_barrier"](bbox:${minLat},${minLng},${maxLat},${maxLng});
        );
        out geom;
      `;

      logger.info(`Fetching OSM infrastructure data for bbox: ${minLat},${minLng},${maxLat},${maxLng}`);
      const response: AxiosResponse<OSMResponse> = await axios.post(this.overpassUrl, query, {
        headers: { 'Content-Type': 'text/plain' }
      });

      const infrastructure = this.parseInfrastructureData(response.data);
      this.setCachedData(cacheKey, infrastructure);

      return infrastructure;

    } catch (error: any) {
      logger.error(`Error fetching OSM infrastructure data:`, error.message);

      if (error.response?.status === 429) {
        logger.warn('OSM Overpass API rate limit exceeded');
      } else if (error.response?.status === 504) {
        logger.warn('OSM query timeout - try smaller bounding box');
      }

      return null;
    }
  }

  /**
   * Get specific river/stream data
   */
  async getRiverData(riverName?: string, bbox?: [number, number, number, number]): Promise<InfrastructureFeature[]> {
    try {
      let query = `
        [out:json][timeout:25];
        (
          way["waterway"="river"]${bbox ? `(bbox:${bbox.join(',')})` : ''};
          way["waterway"="stream"]${bbox ? `(bbox:${bbox.join(',')})` : ''};
          relation["waterway"="river"]${bbox ? `(bbox:${bbox.join(',')})` : ''};
        `;
      if (riverName) {
        query += `way["name"~"${riverName}",i]${bbox ? `(bbox:${bbox.join(',')})` : ''};`;
      }
      query += `); out geom;`;

      logger.info(`Fetching river data${riverName ? ` for: ${riverName}` : ''}`);
      const response: AxiosResponse<OSMResponse> = await axios.post(this.overpassUrl, query, {
        headers: { 'Content-Type': 'text/plain' }
      });

      return this.parseElementsToFeatures(response.data.elements, 'river');

    } catch (error: any) {
      logger.error(`Error fetching river data:`, error.message);
      return [];
    }
  }

  /**
   * Get road network data
   */
  async getRoadNetwork(bbox: [number, number, number, number]): Promise<InfrastructureFeature[]> {
    try {
      const query = `
        [out:json][timeout:25];
        (
          way["highway"]["highway"!~"footway|path|cycleway|track|bridleway"](bbox:${bbox.join(',')});
        );
        out geom;
      `;

      logger.info(`Fetching road network for bbox: ${bbox.join(',')}`);
      const response: AxiosResponse<OSMResponse> = await axios.post(this.overpassUrl, query, {
        headers: { 'Content-Type': 'text/plain' }
      });

      return this.parseElementsToFeatures(response.data.elements, 'road');

    } catch (error: any) {
      logger.error(`Error fetching road network:`, error.message);
      return [];
    }
  }

  /**
   * Get building data for population density analysis
   */
  async getBuildings(bbox: [number, number, number, number]): Promise<InfrastructureFeature[]> {
    try {
      const query = `
        [out:json][timeout:25];
        (
          way["building"](bbox:${bbox.join(',')});
          relation["building"](bbox:${bbox.join(',')});
        );
        out geom;
      `;

      logger.info(`Fetching buildings for bbox: ${bbox.join(',')}`);
      const response: AxiosResponse<OSMResponse> = await axios.post(this.overpassUrl, query, {
        headers: { 'Content-Type': 'text/plain' }
      });

      return this.parseElementsToFeatures(response.data.elements, 'building');

    } catch (error: any) {
      logger.error(`Error fetching buildings:`, error.message);
      return [];
    }
  }

  /**
   * Calculate flood vulnerability based on infrastructure
   */
  analyzeFloodVulnerability(infrastructure: FloodInfrastructure): {
    vulnerability_score: number;
    risk_factors: string[];
    recommendations: string[];
    affected_infrastructure: {
      high_risk_count: number;
      medium_risk_count: number;
      low_risk_count: number;
    };
  } {
    let vulnerabilityScore = 0;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    // Analyze proximity to water bodies
    const totalWaterFeatures = infrastructure.rivers.length + infrastructure.water_bodies.length;

    if (totalWaterFeatures > 10) {
      vulnerabilityScore += 25;
      riskFactors.push('High density of water bodies nearby');
      recommendations.push('Implement comprehensive flood monitoring system');
      highRiskCount += totalWaterFeatures;
    } else if (totalWaterFeatures > 5) {
      vulnerabilityScore += 15;
      riskFactors.push('Moderate density of water bodies nearby');
      recommendations.push('Regular flood risk assessments');
      mediumRiskCount += totalWaterFeatures;
    } else if (totalWaterFeatures > 0) {
      vulnerabilityScore += 5;
      riskFactors.push('Some water bodies in vicinity');
      lowRiskCount += totalWaterFeatures;
    }

    // Analyze drainage infrastructure
    if (infrastructure.drainage_channels.length === 0) {
      vulnerabilityScore += 20;
      riskFactors.push('Limited or no visible drainage infrastructure');
      recommendations.push('Consider improving drainage systems');
      highRiskCount += 1;
    } else if (infrastructure.drainage_channels.length < 3) {
      vulnerabilityScore += 10;
      riskFactors.push('Limited drainage infrastructure');
      recommendations.push('Enhance existing drainage systems');
      mediumRiskCount += 1;
    }

    // Analyze flood defenses
    if (infrastructure.flood_defenses.length === 0) {
      vulnerabilityScore += 25;
      riskFactors.push('No visible flood defense structures');
      recommendations.push('Install flood barriers and levees');
      recommendations.push('Create flood emergency response plan');
      highRiskCount += 1;
    } else if (infrastructure.flood_defenses.length < 5) {
      vulnerabilityScore += 10;
      riskFactors.push('Limited flood defense infrastructure');
      recommendations.push('Expand flood defense systems');
      mediumRiskCount += 1;
    }

    // Analyze building density (higher density = higher flood risk)
    const buildingCount = infrastructure.buildings.length;

    if (buildingCount > 50) {
      vulnerabilityScore += 15;
      riskFactors.push('High building density increases flood vulnerability');
      recommendations.push('Implement building elevation standards');
      recommendations.push('Create community flood preparedness programs');
      highRiskCount += Math.floor(buildingCount / 10);
    } else if (buildingCount > 20) {
      vulnerabilityScore += 8;
      riskFactors.push('Moderate building density');
      recommendations.push('Regular building inspections for flood resistance');
      mediumRiskCount += Math.floor(buildingCount / 10);
    }

    // Analyze road network vulnerability
    const roadCount = infrastructure.roads.length;

    if (roadCount > 30) {
      vulnerabilityScore += 10;
      riskFactors.push('Extensive road network at flood risk');
      recommendations.push('Implement road drainage improvements');
      recommendations.push('Create alternative transportation routes');
      mediumRiskCount += Math.floor(roadCount / 10);
    }

    // Ensure score doesn't exceed 100
    vulnerabilityScore = Math.min(vulnerabilityScore, 100);

    return {
      vulnerability_score: vulnerabilityScore,
      risk_factors: riskFactors.length > 0 ? riskFactors : ['No significant infrastructure risk factors identified'],
      recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring infrastructure conditions'],
      affected_infrastructure: {
        high_risk_count: highRiskCount,
        medium_risk_count: mediumRiskCount,
        low_risk_count: lowRiskCount
      }
    };
  }

  /**
   * Get address details for coordinates
   */
  async reverseGeocode(lat: number, lng: number): Promise<{
    place_id: number;
    osm_id: number;
    osm_type: string;
    licence: string;
    lat: string;
    lon: string;
    display_name: string;
    address?: {
      house_number?: string;
      road?: string;
      suburb?: string;
      city?: string;
      county?: string;
      state?: string;
      postcode?: string;
      country?: string;
      country_code?: string;
    };
  } | null> {
    try {
      const params = {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      };

      logger.info(`Reverse geocoding for coordinates: ${lat}, ${lng}`);
      const response: AxiosResponse<any> = await axios.get(`${this.nominatimUrl}/reverse`, { params });

      return response.data;

    } catch (error: any) {
      logger.error(`Error reverse geocoding (${lat}, ${lng}):`, error.message);
      return null;
    }
  }

  private parseInfrastructureData(osmData: OSMResponse): FloodInfrastructure {
    const rivers: InfrastructureFeature[] = [];
    const water_bodies: InfrastructureFeature[] = [];
    const drainage_channels: InfrastructureFeature[] = [];
    const roads: InfrastructureFeature[] = [];
    const buildings: InfrastructureFeature[] = [];
    const flood_defenses: InfrastructureFeature[] = [];

    for (const element of osmData.elements) {
      if (element.type === 'way' && element.geometry) {
        const feature = this.wayToFeature(element);

        // Classify based on tags
        if (element.tags?.waterway === 'river' || element.tags?.waterway === 'stream') {
          rivers.push({ ...feature, type: 'river' });
        } else if (element.tags?.natural === 'water' || element.tags?.water === 'lake' || element.tags?.landuse === 'reservoir') {
          water_bodies.push({ ...feature, type: 'water_body' });
        } else if (element.tags?.waterway === 'drain' || element.tags?.man_made === 'drain') {
          drainage_channels.push({ ...feature, type: 'drainage' });
        } else if (element.tags?.highway && !['footway', 'path', 'cycleway', 'track', 'bridleway'].includes(element.tags.highway)) {
          roads.push({ ...feature, type: 'road' });
        } else if (element.tags?.building) {
          buildings.push({ ...feature, type: 'building' });
        } else if (element.tags?.man_made === 'dyke' || element.tags?.man_made === 'levee' || element.tags?.barrier === 'flood_barrier') {
          flood_defenses.push({ ...feature, type: 'drainage' });
        }
      }
    }

    return {
      rivers,
      water_bodies,
      drainage_channels,
      roads,
      buildings,
      flood_defenses
    };
  }

  private parseElementsToFeatures(elements: OSMElement[], defaultType: InfrastructureFeature['type']): InfrastructureFeature[] {
    return elements
      .filter(element => element.type === 'way' && (element as OSMWay).geometry)
      .map(element => this.wayToFeature(element as OSMWay, defaultType));
  }

  private wayToFeature(way: OSMWay, defaultType?: InfrastructureFeature['type']): InfrastructureFeature {
    const coordinates: Array<[number, number]> = way.geometry?.map(point => [point.lon, point.lat]) || [];

    // Determine type from tags if not provided
    let type = defaultType;
    if (!type) {
      if (way.tags?.waterway) type = 'river';
      else if (way.tags?.highway) type = 'road';
      else if (way.tags?.building) type = 'building';
      else if (way.tags?.man_made === 'drain') type = 'drainage';
      else type = 'water_body';
    }

    return {
      id: `way_${way.id}`,
      type,
      name: way.tags?.name || undefined,
      coordinates,
      properties: {
        length: this.calculateWayLength(coordinates),
        osm_id: way.id
      },
      osm_tags: way.tags || {}
    };
  }

  private calculateWayLength(coordinates: Array<[number, number]>): number {
    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const coord1 = coordinates[i - 1];
      const coord2 = coordinates[i];
      if (!coord1 || !coord2) continue;
      const [lon1, lat1] = coord1;
      const [lon2, lat2] = coord2;

      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in kilometers
      const dLat = this.toRadians(lat2 - lat1);
      const dLon = this.toRadians(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    return totalDistance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Clean up old cache entries
    if (this.cache.size > 50) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('OSM API cache cleared');
  }
}

export default new OpenStreetMapService();
