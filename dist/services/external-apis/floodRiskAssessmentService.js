"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const weatherService_1 = require("./weatherService");
const elevationService_1 = require("./elevationService");
const openStreetMapService_1 = require("./openStreetMapService");
const vietnamGovService_1 = require("./vietnamGovService");
const logger_1 = require("../../utils/logger");
class FloodRiskAssessmentService {
    async assessFloodRisk(location) {
        try {
            logger_1.logger.info(`Starting comprehensive flood risk assessment for location: ${location.name || `${location.latitude}, ${location.longitude}`}`);
            const assessmentDate = new Date().toISOString();
            const dataSources = [];
            const weatherRisk = await this.assessWeatherRisk(location);
            dataSources.push('WeatherAPI');
            const terrainRisk = await this.assessTerrainRisk(location);
            dataSources.push('Open-Elevation API');
            const infrastructureRisk = await this.assessInfrastructureRisk(location);
            dataSources.push('OpenStreetMap');
            const historicalRisk = await this.assessHistoricalRisk(location);
            dataSources.push('Vietnam Government Data');
            const populationRisk = await this.assessPopulationRisk(location);
            dataSources.push('Vietnam Government Data');
            const overallScore = Math.round(weatherRisk.score * 0.4 +
                terrainRisk.score * 0.25 +
                infrastructureRisk.score * 0.15 +
                historicalRisk.score * 0.15 +
                populationRisk.score * 0.05);
            const riskLevel = this.calculateRiskLevel(overallScore);
            const recommendations = this.generateRecommendations(weatherRisk, terrainRisk, infrastructureRisk, historicalRisk, populationRisk, overallScore);
            const confidenceLevel = this.calculateConfidenceLevel([
                weatherRisk.score > 0,
                terrainRisk.score >= 0,
                infrastructureRisk.score >= 0,
                historicalRisk.score >= 0,
                populationRisk.score >= 0,
            ]);
            const assessment = {
                location,
                overall_risk_score: overallScore,
                risk_level: riskLevel,
                assessment_date: assessmentDate,
                factors: {
                    weather_risk: weatherRisk,
                    terrain_risk: terrainRisk,
                    infrastructure_risk: infrastructureRisk,
                    historical_risk: historicalRisk,
                    population_risk: populationRisk,
                },
                recommendations,
                data_sources: [...new Set(dataSources)],
                confidence_level: confidenceLevel,
            };
            logger_1.logger.info(`Completed flood risk assessment for ${location.name || 'location'} with risk level: ${riskLevel} (${overallScore}/100)`);
            return assessment;
        }
        catch (error) {
            logger_1.logger.error(`Error in flood risk assessment for location ${location.name}:`, error.message);
            return null;
        }
    }
    async batchAssessFloodRisk(locations) {
        logger_1.logger.info(`Starting batch flood risk assessment for ${locations.length} locations`);
        const assessments = [];
        const batchSize = 5;
        for (let i = 0; i < locations.length; i += batchSize) {
            const batch = locations.slice(i, i + batchSize);
            const batchPromises = batch.map((location) => this.assessFloodRisk(location));
            const batchResults = await Promise.all(batchPromises);
            const validResults = batchResults.filter((result) => result !== null);
            assessments.push(...validResults);
            if (i + batchSize < locations.length) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        }
        logger_1.logger.info(`Completed batch assessment: ${assessments.length}/${locations.length} successful`);
        return assessments;
    }
    async getFloodAlerts(province) {
        try {
            logger_1.logger.info(`Getting flood alerts for province: ${province}`);
            const weatherAlerts = await weatherService_1.default.getWeatherAlerts(province);
            const hydroData = await vietnamGovService_1.default.getHydroData(province);
            const alerts = [];
            if (weatherAlerts?.alerts) {
                weatherAlerts.alerts.forEach((alert) => {
                    alerts.push({
                        type: 'weather',
                        severity: alert.severity,
                        location: province,
                        message: alert.message,
                        timestamp: weatherAlerts.last_updated,
                        recommended_actions: this.getRecommendedActions(alert.type, alert.severity),
                    });
                });
            }
            hydroData.forEach((station) => {
                const latestMeasurement = station.measurements[station.measurements.length - 1];
                if (latestMeasurement && latestMeasurement.water_level >= station.flood_levels.danger) {
                    alerts.push({
                        type: 'hydro_danger',
                        severity: 'high',
                        location: station.station_name,
                        message: `Danger water level: ${latestMeasurement.water_level}m (danger: ${station.flood_levels.danger}m)`,
                        timestamp: station.last_updated,
                        recommended_actions: [
                            'Immediate evacuation of low-lying areas',
                            'Activate emergency response teams',
                            'Close roads and bridges if necessary',
                            'Monitor water levels continuously',
                        ],
                    });
                }
                else if (latestMeasurement &&
                    latestMeasurement.water_level >= station.flood_levels.alert) {
                    alerts.push({
                        type: 'hydro_alert',
                        severity: 'medium',
                        location: station.station_name,
                        message: `Alert water level: ${latestMeasurement.water_level}m (alert: ${station.flood_levels.alert}m)`,
                        timestamp: station.last_updated,
                        recommended_actions: [
                            'Prepare emergency supplies',
                            'Monitor weather updates',
                            'Be ready for evacuation',
                            'Secure property and vehicles',
                        ],
                    });
                }
            });
            const highSeverityCount = alerts.filter((alert) => alert.severity === 'high').length;
            return {
                alerts,
                summary: {
                    total_alerts: alerts.length,
                    high_severity_count: highSeverityCount,
                    last_updated: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting flood alerts for ${province}:`, error.message);
            return {
                alerts: [],
                summary: {
                    total_alerts: 0,
                    high_severity_count: 0,
                    last_updated: new Date().toISOString(),
                },
            };
        }
    }
    async assessWeatherRisk(location) {
        try {
            const locationString = location.name || `${location.latitude},${location.longitude}`;
            const currentWeather = await weatherService_1.default.getCurrentWeather(locationString);
            const forecast = await weatherService_1.default.getWeatherForecast(locationString, 5);
            const weatherData = forecast || currentWeather;
            const weatherRisk = weatherData
                ? weatherService_1.default.calculateFloodRisk(weatherData)
                : { risk_score: 50, risk_level: 'medium', factors: ['No weather data available'] };
            return {
                score: weatherRisk.risk_score,
                level: weatherRisk.risk_level,
                factors: weatherRisk.factors,
                current_weather: currentWeather,
                forecast: forecast,
            };
        }
        catch (error) {
            logger_1.logger.error('Error assessing weather risk:', error);
            return {
                score: 50,
                level: 'medium',
                factors: ['Unable to assess weather conditions'],
                current_weather: null,
                forecast: null,
            };
        }
    }
    async assessTerrainRisk(location) {
        try {
            const factors = await elevationService_1.default.getFloodRiskFactors(location.latitude, location.longitude);
            if (!factors) {
                return {
                    score: 50,
                    level: 'medium',
                    elevation: 0,
                    slope: 0,
                    proximity_to_water: 0.5,
                    factors: ['Unable to assess terrain conditions'],
                };
            }
            const vulnerability = elevationService_1.default.analyzeTerrainVulnerability(factors);
            return {
                score: vulnerability.vulnerability_score,
                level: vulnerability.vulnerability_score > 60
                    ? 'high'
                    : vulnerability.vulnerability_score > 30
                        ? 'medium'
                        : 'low',
                elevation: factors.elevation,
                slope: factors.slope,
                proximity_to_water: factors.proximity_to_water,
                factors: vulnerability.risk_factors,
            };
        }
        catch (error) {
            logger_1.logger.error('Error assessing terrain risk:', error);
            return {
                score: 50,
                level: 'medium',
                elevation: 0,
                slope: 0,
                proximity_to_water: 0.5,
                factors: ['Unable to assess terrain conditions'],
            };
        }
    }
    async assessInfrastructureRisk(location) {
        try {
            const buffer = 0.045;
            const bbox = [
                location.longitude - buffer,
                location.latitude - buffer,
                location.longitude + buffer,
                location.latitude + buffer,
            ];
            const infrastructure = await openStreetMapService_1.default.getInfrastructureData(...bbox);
            if (!infrastructure) {
                return {
                    score: 50,
                    level: 'medium',
                    factors: ['Unable to assess infrastructure'],
                    infrastructure_count: { total: 0 },
                };
            }
            const vulnerability = openStreetMapService_1.default.analyzeFloodVulnerability(infrastructure);
            return {
                score: vulnerability.vulnerability_score,
                level: vulnerability.vulnerability_score > 60
                    ? 'high'
                    : vulnerability.vulnerability_score > 30
                        ? 'medium'
                        : 'low',
                factors: vulnerability.risk_factors,
                infrastructure_count: {
                    rivers: infrastructure.rivers.length,
                    water_bodies: infrastructure.water_bodies.length,
                    drainage: infrastructure.drainage_channels.length,
                    roads: infrastructure.roads.length,
                    buildings: infrastructure.buildings.length,
                    flood_defenses: infrastructure.flood_defenses.length,
                    total: infrastructure.rivers.length +
                        infrastructure.water_bodies.length +
                        infrastructure.drainage_channels.length +
                        infrastructure.roads.length +
                        infrastructure.buildings.length +
                        infrastructure.flood_defenses.length,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Error assessing infrastructure risk:', error);
            return {
                score: 50,
                level: 'medium',
                factors: ['Unable to assess infrastructure'],
                infrastructure_count: { total: 0 },
            };
        }
    }
    async assessHistoricalRisk(location) {
        try {
            const province = location.province || 'Unknown';
            const disasters = await vietnamGovService_1.default.getDisasterHistory(province, 'flood');
            const analysis = vietnamGovService_1.default.analyzeHistoricalFloodRisk(province);
            return {
                score: analysis.risk_score,
                level: analysis.risk_score > 60 ? 'high' : analysis.risk_score > 30 ? 'medium' : 'low',
                historical_events: analysis.historical_events,
                average_impact: analysis.average_impact,
                trend: analysis.trend,
                factors: [
                    `${analysis.historical_events} historical flood events`,
                    `Average impact: ${analysis.average_impact.toLocaleString()} VND`,
                    `Trend: ${analysis.trend}`,
                ],
            };
        }
        catch (error) {
            logger_1.logger.error('Error assessing historical risk:', error);
            return {
                score: 30,
                level: 'low',
                historical_events: 0,
                average_impact: 0,
                trend: 'unknown',
                factors: ['No historical data available'],
            };
        }
    }
    async assessPopulationRisk(location) {
        try {
            const province = location.province || 'Unknown';
            const densityData = await vietnamGovService_1.default.getPopulationDensity(province);
            if (!densityData) {
                return {
                    score: 30,
                    level: 'low',
                    population_density: 0,
                    urban_percentage: 0,
                    factors: ['No population data available'],
                };
            }
            return {
                score: densityData.vulnerability_score,
                level: densityData.vulnerability_score > 60
                    ? 'high'
                    : densityData.vulnerability_score > 30
                        ? 'medium'
                        : 'low',
                population_density: densityData.density_per_km2,
                urban_percentage: densityData.urban_percentage,
                factors: [
                    `Population density: ${densityData.density_per_km2}/km²`,
                    `Urban percentage: ${densityData.urban_percentage}%`,
                    densityData.density_per_km2 > 500
                        ? 'High population density increases vulnerability'
                        : densityData.density_per_km2 > 200
                            ? 'Moderate population density'
                            : 'Low population density',
                ],
            };
        }
        catch (error) {
            logger_1.logger.error('Error assessing population risk:', error);
            return {
                score: 30,
                level: 'low',
                population_density: 0,
                urban_percentage: 0,
                factors: ['No population data available'],
            };
        }
    }
    calculateRiskLevel(score) {
        if (score >= 80)
            return 'extreme';
        if (score >= 60)
            return 'very_high';
        if (score >= 40)
            return 'high';
        if (score >= 20)
            return 'medium';
        return 'low';
    }
    calculateConfidenceLevel(dataAvailability) {
        const availableCount = dataAvailability.filter(Boolean).length;
        const totalCount = dataAvailability.length;
        if (availableCount >= totalCount * 0.8)
            return 'high';
        if (availableCount >= totalCount * 0.5)
            return 'medium';
        return 'low';
    }
    generateRecommendations(weatherRisk, terrainRisk, infrastructureRisk, historicalRisk, populationRisk, overallScore) {
        const immediateActions = [];
        const shortTerm = [];
        const longTerm = [];
        const preparedness = [];
        if (overallScore >= 80) {
            immediateActions.push('Immediate evacuation of high-risk areas', 'Activate emergency operations center', 'Deploy emergency response teams', 'Close roads and evacuate vehicles');
        }
        else if (overallScore >= 60) {
            immediateActions.push('Monitor water levels continuously', 'Prepare emergency supplies', 'Alert vulnerable populations');
        }
        if (weatherRisk.score >= 60) {
            shortTerm.push('Monitor weather forecasts closely');
            preparedness.push('Prepare emergency weather radio');
        }
        if (terrainRisk.score >= 60) {
            longTerm.push('Consider property elevation or relocation');
            preparedness.push('Create family emergency plan');
        }
        if (infrastructureRisk.score >= 60) {
            longTerm.push('Improve drainage infrastructure');
            shortTerm.push('Clear drains and stormwater systems');
        }
        if (historicalRisk.score >= 60) {
            preparedness.push('Learn from past flood events');
            longTerm.push('Implement flood-resistant building codes');
        }
        if (populationRisk.score >= 60) {
            preparedness.push('Develop community flood preparedness programs');
            shortTerm.push('Organize community evacuation drills');
        }
        return {
            immediate_actions: immediateActions.length > 0 ? immediateActions : ['Monitor local conditions'],
            short_term: shortTerm.length > 0 ? shortTerm : ['Stay informed about weather conditions'],
            long_term: longTerm.length > 0 ? longTerm : ['Consider flood insurance'],
            preparedness: preparedness.length > 0 ? preparedness : ['Create emergency contact list'],
        };
    }
    getRecommendedActions(alertType, severity) {
        const actions = {
            heavy_rain: {
                high: ['Seek higher ground', 'Avoid driving', 'Turn off electrical appliances'],
                medium: ['Monitor water levels', 'Prepare emergency kit', 'Stay indoors if possible'],
            },
            high_humidity: {
                medium: [
                    'Use dehumidifiers if available',
                    'Monitor for mold growth',
                    'Improve ventilation',
                ],
            },
        };
        return actions[alertType]?.[severity] || ['Stay alert and monitor local conditions'];
    }
    async getRegionalRiskSummary(province) {
        try {
            const alerts = await this.getFloodAlerts(province);
            const mockSummary = {
                province,
                assessment_date: new Date().toISOString(),
                overall_risk_level: alerts.summary.high_severity_count > 5
                    ? 'high'
                    : alerts.summary.total_alerts > 10
                        ? 'medium'
                        : 'low',
                high_risk_areas: Math.floor(Math.random() * 20) + 5,
                total_assessed_areas: Math.floor(Math.random() * 100) + 50,
                recent_alerts: alerts.summary.total_alerts,
                recommendations: [
                    'Implement comprehensive flood monitoring system',
                    'Develop emergency response plans',
                    'Improve drainage infrastructure',
                    'Community preparedness programs',
                ],
            };
            return mockSummary;
        }
        catch (error) {
            logger_1.logger.error(`Error getting regional risk summary for ${province}:`, error.message);
            return null;
        }
    }
}
exports.default = new FloodRiskAssessmentService();
//# sourceMappingURL=floodRiskAssessmentService.js.map