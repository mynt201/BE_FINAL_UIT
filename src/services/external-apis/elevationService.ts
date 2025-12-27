import axios, { AxiosResponse } from 'axios';
import { logger } from '../../utils/logger';

interface ElevationPoint {
  latitude: number;
  longitude: number;
  elevation: number;
}

interface ElevationResponse {
  results: Array<{
    latitude: number;
    longitude: number;
    elevation: number;
  }>;
}

interface FloodRiskFactors {
  elevation: number;
  slope: number;
  proximity_to_water: number;
  soil_type?: string;
  land_use?: string;
}

class ElevationService {
  private openElevationUrl: string;
  private cache: Map<string, { data: ElevationPoint[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (elevation data changes rarely)

  constructor() {
    this.openElevationUrl = 'https://api.open-elevation.com/api/v1/lookup';
  }

  /**
   * Get elevation for a single point
   */
  async getElevation(latitude: number, longitude: number): Promise<number | null> {
    try {
      const elevations = await this.getElevations([{ latitude, longitude }]);
      return elevations.length > 0 ? elevations[0]?.elevation ?? null : null;
    } catch (error: any) {
      logger.error(`Error getting elevation for (${latitude}, ${longitude}):`, error.message);
      return null;
    }
  }

  /**
   * Get elevation for multiple points
   */
  async getElevations(points: Array<{ latitude: number; longitude: number }>): Promise<ElevationPoint[]> {
    try {
      if (points.length === 0) {
        return [];
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(points);
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Prepare request payload
      const locations = points.map(point => `${point.latitude},${point.longitude}`).join('|');

      const params = {
        locations: locations
      };

      logger.info(`Fetching elevation data for ${points.length} points`);
      const response: AxiosResponse<ElevationResponse> = await axios.get(this.openElevationUrl, { params });

      if (!response.data?.results) {
        throw new Error('Invalid response from elevation API');
      }

      const elevationData: ElevationPoint[] = response.data.results.map((result, index) => ({
        latitude: points[index]?.latitude || 0,
        longitude: points[index]?.longitude || 0,
        elevation: result.elevation
      }));

      // Cache the results
      this.setCachedData(cacheKey, elevationData);

      return elevationData;

    } catch (error: any) {
      logger.error(`Error fetching elevation data:`, error.message);

      if (error.response?.status === 429) {
        logger.warn('Elevation API rate limit exceeded');
      } else if (error.response?.status === 400) {
        logger.warn('Invalid coordinates provided to elevation API');
      }

      return [];
    }
  }

  /**
   * Get elevation profile along a path (useful for rivers, roads)
   */
  async getElevationProfile(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    numPoints: number = 20
  ): Promise<ElevationPoint[]> {
    try {
      const points: Array<{ latitude: number; longitude: number }> = [];

      // Generate points along the line
      for (let i = 0; i < numPoints; i++) {
        const fraction = i / (numPoints - 1);
        const lat = startLat + (endLat - startLat) * fraction;
        const lng = startLng + (endLng - startLng) * fraction;
        points.push({ latitude: lat, longitude: lng });
      }

      return await this.getElevations(points);

    } catch (error: any) {
      logger.error(`Error getting elevation profile:`, error.message);
      return [];
    }
  }

  /**
   * Calculate slope between two points
   */
  calculateSlope(elevation1: number, elevation2: number, distance: number): number {
    if (distance === 0) return 0;
    return Math.abs(elevation2 - elevation1) / distance * 100; // slope in percentage
  }

  /**
   * Get flood risk factors based on elevation and geography
   */
  async getFloodRiskFactors(
    latitude: number,
    longitude: number
  ): Promise<FloodRiskFactors | null> {
    try {
      // Get elevation at the point
      const elevation = await this.getElevation(latitude, longitude);
      if (elevation === null) {
        return null;
      }

      // Get elevations of surrounding points to calculate slope
      const surroundingPoints = [
        { latitude: latitude + 0.001, longitude: longitude }, // North
        { latitude: latitude - 0.001, longitude: longitude }, // South
        { latitude: latitude, longitude: longitude + 0.001 }, // East
        { latitude: latitude, longitude: longitude - 0.001 }, // West
      ];

      const surroundingElevations = await this.getElevations(surroundingPoints);

      // Calculate average slope
      let totalSlope = 0;
      let slopeCount = 0;

      if (surroundingElevations.length >= 4) {
        // Approximate distance between points (0.001 degrees ≈ 111 meters at equator)
        const pointDistance = 111; // meters

        surroundingElevations.forEach(surrElevation => {
          const slope = this.calculateSlope(elevation, surrElevation.elevation, pointDistance);
          totalSlope += slope;
          slopeCount++;
        });
      }

      const averageSlope = slopeCount > 0 ? totalSlope / slopeCount : 0;

      // Estimate proximity to water (simplified - in reality would use GIS data)
      // Lower elevation generally means higher proximity to water bodies
      let proximityToWater = 0;
      if (elevation < 10) {
        proximityToWater = 0.8; // Very close to water
      } else if (elevation < 50) {
        proximityToWater = 0.6; // Moderately close
      } else if (elevation < 100) {
        proximityToWater = 0.3; // Somewhat close
      } else {
        proximityToWater = 0.1; // Far from water
      }

      return {
        elevation,
        slope: averageSlope,
        proximity_to_water: proximityToWater,
        soil_type: 'unknown', // Would need additional GIS data
        land_use: 'unknown'   // Would need additional GIS data
      };

    } catch (error: any) {
      logger.error(`Error calculating flood risk factors:`, error.message);
      return null;
    }
  }

  /**
   * Analyze terrain for flood vulnerability
   */
  analyzeTerrainVulnerability(factors: FloodRiskFactors): {
    vulnerability_score: number;
    risk_factors: string[];
    recommendations: string[];
  } {
    let vulnerabilityScore = 0;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Elevation factor (lower elevation = higher risk)
    if (factors.elevation < 5) {
      vulnerabilityScore += 40;
      riskFactors.push('Very low elevation (< 5m)');
      recommendations.push('Consider elevated building foundations');
      recommendations.push('Install flood barriers or levees');
    } else if (factors.elevation < 10) {
      vulnerabilityScore += 25;
      riskFactors.push('Low elevation (5-10m)');
      recommendations.push('Prepare flood evacuation plan');
    } else if (factors.elevation < 20) {
      vulnerabilityScore += 10;
      riskFactors.push('Moderate elevation (10-20m)');
      recommendations.push('Monitor weather forecasts closely');
    }

    // Slope factor (steeper slopes can cause faster water runoff)
    if (factors.slope > 20) {
      vulnerabilityScore += 15;
      riskFactors.push('Steep terrain slope');
      recommendations.push('Implement erosion control measures');
    } else if (factors.slope > 10) {
      vulnerabilityScore += 8;
      riskFactors.push('Moderate terrain slope');
    }

    // Proximity to water factor
    if (factors.proximity_to_water > 0.7) {
      vulnerabilityScore += 30;
      riskFactors.push('Very close to water bodies');
      recommendations.push('Install flood detection sensors');
      recommendations.push('Create emergency evacuation routes');
    } else if (factors.proximity_to_water > 0.5) {
      vulnerabilityScore += 20;
      riskFactors.push('Close to water bodies');
      recommendations.push('Prepare sandbags and flood barriers');
    } else if (factors.proximity_to_water > 0.3) {
      vulnerabilityScore += 10;
      riskFactors.push('Moderately close to water bodies');
    }

    // Ensure score doesn't exceed 100
    vulnerabilityScore = Math.min(vulnerabilityScore, 100);

    return {
      vulnerability_score: vulnerabilityScore,
      risk_factors: riskFactors.length > 0 ? riskFactors : ['No significant terrain risk factors'],
      recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring local conditions']
    };
  }

  /**
   * Batch process multiple locations for flood risk assessment
   */
  async batchFloodRiskAssessment(
    locations: Array<{ latitude: number; longitude: number; name?: string }>
  ): Promise<Array<{
    location: { latitude: number; longitude: number; name?: string };
    elevation_data: FloodRiskFactors | null;
    vulnerability: ReturnType<ElevationService['analyzeTerrainVulnerability']> | null;
  }>> {
    const results: Array<{
      location: { latitude: number; longitude: number; name?: string };
      elevation_data: FloodRiskFactors | null;
      vulnerability: ReturnType<ElevationService['analyzeTerrainVulnerability']> | null;
    }> = [];

    // Process in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);

      const batchPromises = batch.map(async (location) => {
        const elevationData = await this.getFloodRiskFactors(location.latitude, location.longitude);
        const vulnerability = elevationData ? this.analyzeTerrainVulnerability(elevationData) : null;

        return {
          location,
          elevation_data: elevationData,
          vulnerability
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to be respectful to the API
      if (i + batchSize < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  private generateCacheKey(points: Array<{ latitude: number; longitude: number }>): string {
    // Create a deterministic cache key from coordinates
    const coords = points.map(p => `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`).join('|');
    return `elevation_${coords}`;
  }

  private getCachedData(key: string): ElevationPoint[] | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: ElevationPoint[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Clean up old cache entries (keep cache size manageable)
    if (this.cache.size > 200) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Elevation API cache cleared');
  }
}

export default new ElevationService();
