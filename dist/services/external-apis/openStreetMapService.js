"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const logger_1 = require("../../utils/logger");
class OpenStreetMapService {
    overpassUrl;
    nominatimUrl;
    cache = new Map();
    CACHE_DURATION = 60 * 60 * 1000;
    constructor() {
        this.overpassUrl = 'https://overpass-api.de/api/interpreter';
        this.nominatimUrl = 'https://nominatim.openstreetmap.org';
    }
    async searchLocations(query, limit = 5) {
        try {
            const params = {
                q: query,
                format: 'json',
                limit: limit,
                countrycodes: 'VN',
                addressdetails: 1
            };
            logger_1.logger.info(`Searching OSM locations for: ${query}`);
            const response = await axios_1.default.get(`${this.nominatimUrl}/search`, { params });
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
        }
        catch (error) {
            logger_1.logger.error(`Error searching OSM locations for ${query}:`, error.message);
            return null;
        }
    }
    async getInfrastructureData(minLat, minLng, maxLat, maxLng) {
        try {
            const cacheKey = `infra_${minLat}_${minLng}_${maxLat}_${maxLng}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
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
            logger_1.logger.info(`Fetching OSM infrastructure data for bbox: ${minLat},${minLng},${maxLat},${maxLng}`);
            const response = await axios_1.default.post(this.overpassUrl, query, {
                headers: { 'Content-Type': 'text/plain' }
            });
            const infrastructure = this.parseInfrastructureData(response.data);
            this.setCachedData(cacheKey, infrastructure);
            return infrastructure;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching OSM infrastructure data:`, error.message);
            if (error.response?.status === 429) {
                logger_1.logger.warn('OSM Overpass API rate limit exceeded');
            }
            else if (error.response?.status === 504) {
                logger_1.logger.warn('OSM query timeout - try smaller bounding box');
            }
            return null;
        }
    }
    async getRiverData(riverName, bbox) {
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
            logger_1.logger.info(`Fetching river data${riverName ? ` for: ${riverName}` : ''}`);
            const response = await axios_1.default.post(this.overpassUrl, query, {
                headers: { 'Content-Type': 'text/plain' }
            });
            return this.parseElementsToFeatures(response.data.elements, 'river');
        }
        catch (error) {
            logger_1.logger.error(`Error fetching river data:`, error.message);
            return [];
        }
    }
    async getRoadNetwork(bbox) {
        try {
            const query = `
        [out:json][timeout:25];
        (
          way["highway"]["highway"!~"footway|path|cycleway|track|bridleway"](bbox:${bbox.join(',')});
        );
        out geom;
      `;
            logger_1.logger.info(`Fetching road network for bbox: ${bbox.join(',')}`);
            const response = await axios_1.default.post(this.overpassUrl, query, {
                headers: { 'Content-Type': 'text/plain' }
            });
            return this.parseElementsToFeatures(response.data.elements, 'road');
        }
        catch (error) {
            logger_1.logger.error(`Error fetching road network:`, error.message);
            return [];
        }
    }
    async getBuildings(bbox) {
        try {
            const query = `
        [out:json][timeout:25];
        (
          way["building"](bbox:${bbox.join(',')});
          relation["building"](bbox:${bbox.join(',')});
        );
        out geom;
      `;
            logger_1.logger.info(`Fetching buildings for bbox: ${bbox.join(',')}`);
            const response = await axios_1.default.post(this.overpassUrl, query, {
                headers: { 'Content-Type': 'text/plain' }
            });
            return this.parseElementsToFeatures(response.data.elements, 'building');
        }
        catch (error) {
            logger_1.logger.error(`Error fetching buildings:`, error.message);
            return [];
        }
    }
    analyzeFloodVulnerability(infrastructure) {
        let vulnerabilityScore = 0;
        const riskFactors = [];
        const recommendations = [];
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let lowRiskCount = 0;
        const totalWaterFeatures = infrastructure.rivers.length + infrastructure.water_bodies.length;
        if (totalWaterFeatures > 10) {
            vulnerabilityScore += 25;
            riskFactors.push('High density of water bodies nearby');
            recommendations.push('Implement comprehensive flood monitoring system');
            highRiskCount += totalWaterFeatures;
        }
        else if (totalWaterFeatures > 5) {
            vulnerabilityScore += 15;
            riskFactors.push('Moderate density of water bodies nearby');
            recommendations.push('Regular flood risk assessments');
            mediumRiskCount += totalWaterFeatures;
        }
        else if (totalWaterFeatures > 0) {
            vulnerabilityScore += 5;
            riskFactors.push('Some water bodies in vicinity');
            lowRiskCount += totalWaterFeatures;
        }
        if (infrastructure.drainage_channels.length === 0) {
            vulnerabilityScore += 20;
            riskFactors.push('Limited or no visible drainage infrastructure');
            recommendations.push('Consider improving drainage systems');
            highRiskCount += 1;
        }
        else if (infrastructure.drainage_channels.length < 3) {
            vulnerabilityScore += 10;
            riskFactors.push('Limited drainage infrastructure');
            recommendations.push('Enhance existing drainage systems');
            mediumRiskCount += 1;
        }
        if (infrastructure.flood_defenses.length === 0) {
            vulnerabilityScore += 25;
            riskFactors.push('No visible flood defense structures');
            recommendations.push('Install flood barriers and levees');
            recommendations.push('Create flood emergency response plan');
            highRiskCount += 1;
        }
        else if (infrastructure.flood_defenses.length < 5) {
            vulnerabilityScore += 10;
            riskFactors.push('Limited flood defense infrastructure');
            recommendations.push('Expand flood defense systems');
            mediumRiskCount += 1;
        }
        const buildingCount = infrastructure.buildings.length;
        if (buildingCount > 50) {
            vulnerabilityScore += 15;
            riskFactors.push('High building density increases flood vulnerability');
            recommendations.push('Implement building elevation standards');
            recommendations.push('Create community flood preparedness programs');
            highRiskCount += Math.floor(buildingCount / 10);
        }
        else if (buildingCount > 20) {
            vulnerabilityScore += 8;
            riskFactors.push('Moderate building density');
            recommendations.push('Regular building inspections for flood resistance');
            mediumRiskCount += Math.floor(buildingCount / 10);
        }
        const roadCount = infrastructure.roads.length;
        if (roadCount > 30) {
            vulnerabilityScore += 10;
            riskFactors.push('Extensive road network at flood risk');
            recommendations.push('Implement road drainage improvements');
            recommendations.push('Create alternative transportation routes');
            mediumRiskCount += Math.floor(roadCount / 10);
        }
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
    async reverseGeocode(lat, lng) {
        try {
            const params = {
                lat: lat,
                lon: lng,
                format: 'json',
                addressdetails: 1
            };
            logger_1.logger.info(`Reverse geocoding for coordinates: ${lat}, ${lng}`);
            const response = await axios_1.default.get(`${this.nominatimUrl}/reverse`, { params });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error reverse geocoding (${lat}, ${lng}):`, error.message);
            return null;
        }
    }
    parseInfrastructureData(osmData) {
        const rivers = [];
        const water_bodies = [];
        const drainage_channels = [];
        const roads = [];
        const buildings = [];
        const flood_defenses = [];
        for (const element of osmData.elements) {
            if (element.type === 'way' && element.geometry) {
                const feature = this.wayToFeature(element);
                if (element.tags?.waterway === 'river' || element.tags?.waterway === 'stream') {
                    rivers.push({ ...feature, type: 'river' });
                }
                else if (element.tags?.natural === 'water' || element.tags?.water === 'lake' || element.tags?.landuse === 'reservoir') {
                    water_bodies.push({ ...feature, type: 'water_body' });
                }
                else if (element.tags?.waterway === 'drain' || element.tags?.man_made === 'drain') {
                    drainage_channels.push({ ...feature, type: 'drainage' });
                }
                else if (element.tags?.highway && !['footway', 'path', 'cycleway', 'track', 'bridleway'].includes(element.tags.highway)) {
                    roads.push({ ...feature, type: 'road' });
                }
                else if (element.tags?.building) {
                    buildings.push({ ...feature, type: 'building' });
                }
                else if (element.tags?.man_made === 'dyke' || element.tags?.man_made === 'levee' || element.tags?.barrier === 'flood_barrier') {
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
    parseElementsToFeatures(elements, defaultType) {
        return elements
            .filter(element => element.type === 'way' && element.geometry)
            .map(element => this.wayToFeature(element, defaultType));
    }
    wayToFeature(way, defaultType) {
        const coordinates = way.geometry?.map(point => [point.lon, point.lat]) || [];
        let type = defaultType;
        if (!type) {
            if (way.tags?.waterway)
                type = 'river';
            else if (way.tags?.highway)
                type = 'road';
            else if (way.tags?.building)
                type = 'building';
            else if (way.tags?.man_made === 'drain')
                type = 'drainage';
            else
                type = 'water_body';
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
    calculateWayLength(coordinates) {
        let totalDistance = 0;
        for (let i = 1; i < coordinates.length; i++) {
            const coord1 = coordinates[i - 1];
            const coord2 = coordinates[i];
            if (!coord1 || !coord2)
                continue;
            const [lon1, lat1] = coord1;
            const [lon2, lat2] = coord2;
            const R = 6371;
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
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }
    setCachedData(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
        if (this.cache.size > 50) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
    }
    clearCache() {
        this.cache.clear();
        logger_1.logger.info('OSM API cache cleared');
    }
}
exports.default = new OpenStreetMapService();
//# sourceMappingURL=openStreetMapService.js.map