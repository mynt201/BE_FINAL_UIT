interface Location {
    latitude: number;
    longitude: number;
    name?: string;
    province?: string;
    district?: string;
    ward?: string;
}
interface FloodRiskAssessment {
    location: Location;
    overall_risk_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'very_high' | 'extreme';
    assessment_date: string;
    factors: {
        weather_risk: {
            score: number;
            level: string;
            factors: string[];
            current_weather: any;
            forecast: any;
        };
        terrain_risk: {
            score: number;
            level: string;
            elevation: number;
            slope: number;
            proximity_to_water: number;
            factors: string[];
        };
        infrastructure_risk: {
            score: number;
            level: string;
            factors: string[];
            infrastructure_count: any;
        };
        historical_risk: {
            score: number;
            level: string;
            historical_events: number;
            average_impact: number;
            trend: string;
            factors: string[];
        };
        population_risk: {
            score: number;
            level: string;
            population_density: number;
            urban_percentage: number;
            factors: string[];
        };
    };
    recommendations: {
        immediate_actions: string[];
        short_term: string[];
        long_term: string[];
        preparedness: string[];
    };
    data_sources: string[];
    confidence_level: 'low' | 'medium' | 'high';
}
declare class FloodRiskAssessmentService {
    assessFloodRisk(location: Location): Promise<FloodRiskAssessment | null>;
    batchAssessFloodRisk(locations: Location[]): Promise<FloodRiskAssessment[]>;
    getFloodAlerts(province: string): Promise<{
        alerts: Array<{
            type: string;
            severity: string;
            location: string;
            message: string;
            timestamp: string;
            recommended_actions: string[];
        }>;
        summary: {
            total_alerts: number;
            high_severity_count: number;
            last_updated: string;
        };
    }>;
    private assessWeatherRisk;
    private assessTerrainRisk;
    private assessInfrastructureRisk;
    private assessHistoricalRisk;
    private assessPopulationRisk;
    private calculateRiskLevel;
    private calculateConfidenceLevel;
    private generateRecommendations;
    private getRecommendedActions;
    getRegionalRiskSummary(province: string): Promise<{
        province: string;
        assessment_date: string;
        overall_risk_level: string;
        high_risk_areas: number;
        total_assessed_areas: number;
        recent_alerts: number;
        recommendations: string[];
    } | null>;
}
declare const _default: FloodRiskAssessmentService;
export default _default;
//# sourceMappingURL=floodRiskAssessmentService.d.ts.map