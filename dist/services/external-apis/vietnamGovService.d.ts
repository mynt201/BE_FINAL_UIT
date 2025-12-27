interface PopulationData {
    province_code: string;
    province_name: string;
    district_code?: string;
    district_name?: string;
    ward_code?: string;
    ward_name?: string;
    population: number;
    area_km2: number;
    density_per_km2: number;
    year: number;
    source: string;
}
interface AdministrativeUnit {
    id: string;
    name: string;
    level: 'province' | 'district' | 'ward';
    code: string;
    parent_code?: string;
    population?: number;
    area?: number;
    coordinates?: {
        lat: number;
        lng: number;
    };
    bounding_box?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
}
interface DisasterHistory {
    id: string;
    type: 'flood' | 'storm' | 'drought' | 'earthquake' | 'landslide';
    location: {
        province: string;
        district?: string;
        ward?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    date: string;
    severity: 'low' | 'medium' | 'high' | 'severe';
    affected_population: number;
    economic_damage: number;
    deaths: number;
    description: string;
    response_actions: string[];
    source: string;
}
interface HydroData {
    station_id: string;
    station_name: string;
    river_name: string;
    location: {
        province: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    measurements: Array<{
        date: string;
        water_level: number;
        flow_rate: number;
        temperature: number;
        rainfall_24h: number;
    }>;
    flood_levels: {
        warning: number;
        alert: number;
        danger: number;
    };
    last_updated: string;
}
declare class VietnamGovernmentService {
    private populationApiUrl;
    private administrativeApiUrl;
    private disasterApiUrl;
    private hydroApiUrl;
    private cache;
    private readonly CACHE_DURATION;
    constructor();
    getPopulationData(level?: 'province' | 'district' | 'ward', year?: number): Promise<PopulationData[]>;
    getAdministrativeUnits(): Promise<AdministrativeUnit[]>;
    getDisasterHistory(province?: string, disasterType?: 'flood' | 'storm' | 'drought' | 'landslide', yearRange?: {
        start: number;
        end: number;
    }): Promise<DisasterHistory[]>;
    getHydroData(province?: string): Promise<HydroData[]>;
    analyzeHistoricalFloodRisk(provinceName: string): {
        risk_score: number;
        historical_events: number;
        average_impact: number;
        trend: 'increasing' | 'stable' | 'decreasing';
        recommendations: string[];
    };
    getPopulationDensity(provinceName: string): Promise<{
        province: string;
        total_population: number;
        area_km2: number;
        density_per_km2: number;
        urban_percentage: number;
        vulnerability_score: number;
    } | null>;
    private getMockPopulationData;
    private getMockAdministrativeUnits;
    private getMockDisasterHistory;
    private getMockHydroData;
    private getCachedData;
    private setCachedData;
    clearCache(): void;
}
declare const _default: VietnamGovernmentService;
export default _default;
//# sourceMappingURL=vietnamGovService.d.ts.map