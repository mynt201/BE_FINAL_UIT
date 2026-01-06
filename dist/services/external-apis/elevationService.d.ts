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
declare class ElevationService {
    private openElevationUrl;
    private cache;
    private readonly CACHE_DURATION;
    constructor();
    getElevation(latitude: number, longitude: number): Promise<number | null>;
    getElevations(points: Array<{
        latitude: number;
        longitude: number;
    }>): Promise<ElevationPoint[]>;
    getElevationProfile(startLat: number, startLng: number, endLat: number, endLng: number, numPoints?: number): Promise<ElevationPoint[]>;
    calculateSlope(elevation1: number, elevation2: number, distance: number): number;
    getFloodRiskFactors(latitude: number, longitude: number): Promise<FloodRiskFactors | null>;
    analyzeTerrainVulnerability(factors: FloodRiskFactors): {
        vulnerability_score: number;
        risk_factors: string[];
        recommendations: string[];
    };
    batchFloodRiskAssessment(locations: Array<{
        latitude: number;
        longitude: number;
        name?: string;
    }>): Promise<Array<{
        location: {
            latitude: number;
            longitude: number;
            name?: string;
        };
        elevation_data: FloodRiskFactors | null;
        vulnerability: ReturnType<ElevationService['analyzeTerrainVulnerability']> | null;
    }>>;
    private generateCacheKey;
    private getCachedData;
    private setCachedData;
    clearCache(): void;
}
export default ElevationService;
//# sourceMappingURL=elevationService.d.ts.map