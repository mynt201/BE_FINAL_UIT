declare class FloodRiskAssessmentService {
    assessFloodRisk(latitude: number, longitude: number): Promise<any>;
    getRiskAlerts(location: string): Promise<any[]>;
    getFloodForecast(latitude: number, longitude: number): Promise<any>;
}
declare const floodRiskAssessmentService: FloodRiskAssessmentService;
export default floodRiskAssessmentService;
//# sourceMappingURL=floodRiskAssessmentService.d.ts.map