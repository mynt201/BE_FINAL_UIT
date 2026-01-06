interface ElevationPoint {
  latitude: number;
  longitude: number;
  elevation: number;
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
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_DURATION: number = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.openElevationUrl = 'https://api.open-elevation.com/api/v1/lookup';
    this.cache = new Map();
  }

  async getElevation(latitude: number, longitude: number): Promise<number | null> {
    try {
      const points = [{ latitude, longitude }];
      const elevations = await this.getElevations(points);
      return elevations.length > 0 ? elevations[0].elevation : null;
    } catch (error) {
      console.error('Error getting elevation:', error);
      return null;
    }
  }

  async getElevations(
    points: Array<{ latitude: number; longitude: number }>
  ): Promise<ElevationPoint[]> {
    try {
      const locations = points.map((point) => `${point.latitude},${point.longitude}`).join('|');
      const url = `${this.openElevationUrl}?locations=${locations}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Elevation API error: ${response.status}`);
      }

      const data = (await response.json()) as { results: Array<{ elevation: number }> };
      return data.results.map((result: any, index: number) => ({
        latitude: points[index].latitude,
        longitude: points[index].longitude,
        elevation: result.elevation,
      }));
    } catch (error) {
      console.error('Error getting elevations:', error);
      return [];
    }
  }

  async getElevationProfile(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    numPoints: number = 10
  ): Promise<ElevationPoint[]> {
    const points: Array<{ latitude: number; longitude: number }> = [];

    for (let i = 0; i < numPoints; i++) {
      const fraction = i / (numPoints - 1);
      const lat = startLat + (endLat - startLat) * fraction;
      const lng = startLng + (endLng - startLng) * fraction;
      points.push({ latitude: lat, longitude: lng });
    }

    return await this.getElevations(points);
  }

  calculateSlope(elevation1: number, elevation2: number, distance: number): number {
    if (distance === 0) return 0;
    return Math.abs((elevation2 - elevation1) / distance) * 100; // slope as percentage
  }

  async getFloodRiskFactors(latitude: number, longitude: number): Promise<FloodRiskFactors | null> {
    try {
      const elevation = await this.getElevation(latitude, longitude);
      if (elevation === null) return null;

      // Stub values for other factors
      return {
        elevation,
        slope: 0, // Would need additional calculation
        proximity_to_water: 1000, // Stub distance in meters
        soil_type: 'unknown',
        land_use: 'unknown',
      };
    } catch (error) {
      console.error('Error getting flood risk factors:', error);
      return null;
    }
  }

  analyzeTerrainVulnerability(factors: FloodRiskFactors): {
    vulnerability_score: number;
    risk_factors: string[];
    recommendations: string[];
  } {
    let vulnerability_score = 0;
    const risk_factors: string[] = [];
    const recommendations: string[] = [];

    // Elevation analysis
    if (factors.elevation < 5) {
      vulnerability_score += 3;
      risk_factors.push('Very low elevation');
      recommendations.push('Implement flood barriers and elevated structures');
    } else if (factors.elevation < 10) {
      vulnerability_score += 2;
      risk_factors.push('Low elevation');
      recommendations.push('Regular monitoring and early warning systems');
    }

    // Slope analysis
    if (factors.slope > 20) {
      vulnerability_score += 1;
      risk_factors.push('Steep slope');
      recommendations.push('Erosion control measures');
    }

    // Proximity to water
    if (factors.proximity_to_water < 100) {
      vulnerability_score += 3;
      risk_factors.push('Very close to water body');
      recommendations.push('Flood-proofing of buildings');
    } else if (factors.proximity_to_water < 500) {
      vulnerability_score += 1;
      risk_factors.push('Near water body');
      recommendations.push('Regular drainage maintenance');
    }

    return {
      vulnerability_score: Math.min(vulnerability_score, 5),
      risk_factors,
      recommendations,
    };
  }

  async batchFloodRiskAssessment(
    locations: Array<{ latitude: number; longitude: number; name?: string }>
  ): Promise<
    Array<{
      location: { latitude: number; longitude: number; name?: string };
      elevation_data: FloodRiskFactors | null;
      vulnerability: ReturnType<ElevationService['analyzeTerrainVulnerability']> | null;
    }>
  > {
    const results = [];

    for (const location of locations) {
      const elevation_data = await this.getFloodRiskFactors(location.latitude, location.longitude);
      const vulnerability = elevation_data
        ? this.analyzeTerrainVulnerability(elevation_data)
        : null;

      results.push({
        location,
        elevation_data,
        vulnerability,
      });
    }

    return results;
  }

  private generateCacheKey(latitude: number, longitude: number): string {
    return `elevation_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default ElevationService;
