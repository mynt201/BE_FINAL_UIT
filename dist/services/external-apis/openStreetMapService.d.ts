interface InfrastructureFeature {
    id: string;
    type: 'river' | 'road' | 'railway' | 'building' | 'water_body' | 'drainage';
    name?: string;
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
declare class OpenStreetMapService {
    private overpassUrl;
    private nominatimUrl;
    private cache;
    private readonly CACHE_DURATION;
    constructor();
    searchLocations(query: string, limit?: number): Promise<Array<{
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
    }>>;
    getInfrastructureData(bbox: [number, number, number, number], types?: string[]): Promise<FloodInfrastructure>;
    getFloodRiskInfrastructure(latitude: number, longitude: number, radiusKm?: number): Promise<FloodInfrastructure>;
    analyzeFloodInfrastructure(infrastructure: FloodInfrastructure): {
        flood_risk_score: number;
        vulnerable_elements: string[];
        protective_elements: string[];
        recommendations: string[];
    };
    getAddressDetails(latitude: number, longitude: number): Promise<any>;
    analyzeFloodVulnerability(infrastructure: FloodInfrastructure): Promise<any>;
    clearCache(): void;
}
export default OpenStreetMapService;
//# sourceMappingURL=openStreetMapService.d.ts.map