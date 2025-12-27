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
    }> | null>;
    getInfrastructureData(minLat: number, minLng: number, maxLat: number, maxLng: number): Promise<FloodInfrastructure | null>;
    getRiverData(riverName?: string, bbox?: [number, number, number, number]): Promise<InfrastructureFeature[]>;
    getRoadNetwork(bbox: [number, number, number, number]): Promise<InfrastructureFeature[]>;
    getBuildings(bbox: [number, number, number, number]): Promise<InfrastructureFeature[]>;
    analyzeFloodVulnerability(infrastructure: FloodInfrastructure): {
        vulnerability_score: number;
        risk_factors: string[];
        recommendations: string[];
        affected_infrastructure: {
            high_risk_count: number;
            medium_risk_count: number;
            low_risk_count: number;
        };
    };
    reverseGeocode(lat: number, lng: number): Promise<{
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
    } | null>;
    private parseInfrastructureData;
    private parseElementsToFeatures;
    private wayToFeature;
    private calculateWayLength;
    private toRadians;
    private getCachedData;
    private setCachedData;
    clearCache(): void;
}
declare const _default: OpenStreetMapService;
export default _default;
//# sourceMappingURL=openStreetMapService.d.ts.map