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
interface FloodData {
    location_code: string;
    location_name: string;
    flood_events: Array<{
        date: string;
        severity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
        affected_population: number;
        economic_damage: number;
        description: string;
    }>;
    risk_assessment: {
        overall_risk: 'low' | 'medium' | 'high' | 'very_high';
        risk_factors: string[];
        mitigation_measures: string[];
    };
}
declare class VietnamGovernmentService {
    private baseUrl;
    private cache;
    private readonly CACHE_DURATION;
    constructor();
    getPopulationData(provinceCode?: string, year?: number): Promise<PopulationData[]>;
    getAdministrativeUnits(level?: 'province' | 'district' | 'ward', parentCode?: string): Promise<AdministrativeUnit[]>;
    getFloodHistory(provinceCode?: string, districtCode?: string, limit?: number): Promise<FloodData[]>;
    getFloodRiskAssessment(locationCode: string): Promise<FloodData | null>;
    getWeatherStations(provinceCode?: string): Promise<Array<{
        id: string;
        name: string;
        location: {
            latitude: number;
            longitude: number;
            province: string;
            district?: string;
        };
        type: 'meteorological' | 'hydrological' | 'synoptic';
        operational: boolean;
        data_available_since?: string;
    }>>;
    getHydrologicalData(stationId: string, startDate: string, endDate: string): Promise<Array<{
        date: string;
        water_level: number;
        flow_rate?: number;
        rainfall?: number;
        temperature?: number;
    }>>;
    analyzeFloodPatterns(floodData: FloodData[]): {
        seasonal_patterns: Record<string, number>;
        severity_distribution: Record<string, number>;
        trends: {
            increasing: boolean;
            severity_trend: 'stable' | 'increasing' | 'decreasing';
            frequency_trend: 'stable' | 'increasing' | 'decreasing';
        };
        recommendations: string[];
    };
    getEmergencyContacts(provinceCode?: string): Promise<Array<{
        type: 'police' | 'fire' | 'medical' | 'disaster_management';
        name: string;
        phone: string;
        address?: string;
        coverage_area: string;
    }>>;
    getDisasterHistory(locationCode: string): Promise<any>;
    analyzeHistoricalFloodRisk(locationCode: string): Promise<any>;
    getPopulationDensity(locationCode: string): Promise<number | null>;
    clearCache(): void;
}
export default VietnamGovernmentService;
//# sourceMappingURL=vietnamGovService.d.ts.map