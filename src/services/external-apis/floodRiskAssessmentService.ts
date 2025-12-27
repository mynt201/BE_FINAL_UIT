import weatherService from './weatherService';
import elevationService from './elevationService';
import openStreetMapService from './openStreetMapService';
import vietnamGovService from './vietnamGovService';
import { logger } from '../../utils/logger';

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

class FloodRiskAssessmentService {
  /**
   * Comprehensive flood risk assessment for a location
   */
  async assessFloodRisk(location: Location): Promise<FloodRiskAssessment | null> {
    try {
      logger.info(
        `Starting comprehensive flood risk assessment for location: ${
          location.name || `${location.latitude}, ${location.longitude}`
        }`
      );

      const assessmentDate = new Date().toISOString();
      const dataSources: string[] = [];

      // 1. Weather Risk Assessment (40% weight)
      const weatherRisk = await this.assessWeatherRisk(location);
      dataSources.push('WeatherAPI');

      // 2. Terrain Risk Assessment (25% weight)
      const terrainRisk = await this.assessTerrainRisk(location);
      dataSources.push('Open-Elevation API');

      // 3. Infrastructure Risk Assessment (15% weight)
      const infrastructureRisk = await this.assessInfrastructureRisk(location);
      dataSources.push('OpenStreetMap');

      // 4. Historical Risk Assessment (15% weight)
      const historicalRisk = await this.assessHistoricalRisk(location);
      dataSources.push('Vietnam Government Data');

      // 5. Population Risk Assessment (5% weight)
      const populationRisk = await this.assessPopulationRisk(location);
      dataSources.push('Vietnam Government Data');

      // Calculate overall risk score
      const overallScore = Math.round(
        weatherRisk.score * 0.4 +
          terrainRisk.score * 0.25 +
          infrastructureRisk.score * 0.15 +
          historicalRisk.score * 0.15 +
          populationRisk.score * 0.05
      );

      // Determine risk level
      const riskLevel = this.calculateRiskLevel(overallScore);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        weatherRisk,
        terrainRisk,
        infrastructureRisk,
        historicalRisk,
        populationRisk,
        overallScore
      );

      // Determine confidence level
      const confidenceLevel = this.calculateConfidenceLevel([
        weatherRisk.score > 0,
        terrainRisk.score >= 0,
        infrastructureRisk.score >= 0,
        historicalRisk.score >= 0,
        populationRisk.score >= 0,
      ]);

      const assessment: FloodRiskAssessment = {
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
        data_sources: [...new Set(dataSources)], // Remove duplicates
        confidence_level: confidenceLevel,
      };

      logger.info(
        `Completed flood risk assessment for ${
          location.name || 'location'
        } with risk level: ${riskLevel} (${overallScore}/100)`
      );

      return assessment;
    } catch (error: any) {
      logger.error(`Error in flood risk assessment for location ${location.name}:`, error.message);
      return null;
    }
  }

  /**
   * Batch assessment for multiple locations
   */
  async batchAssessFloodRisk(locations: Location[]): Promise<FloodRiskAssessment[]> {
    logger.info(`Starting batch flood risk assessment for ${locations.length} locations`);

    const assessments: FloodRiskAssessment[] = [];
    const batchSize = 5; // Process 5 locations at a time to avoid overwhelming APIs

    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);

      const batchPromises = batch.map((location) => this.assessFloodRisk(location));
      const batchResults = await Promise.all(batchPromises);

      // Filter out null results
      const validResults = batchResults.filter(
        (result) => result !== null
      ) as FloodRiskAssessment[];
      assessments.push(...validResults);

      // Respectful delay between batches
      if (i + batchSize < locations.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    logger.info(`Completed batch assessment: ${assessments.length}/${locations.length} successful`);
    return assessments;
  }

  /**
   * Get real-time flood alerts for a region
   */
  async getFloodAlerts(province: string): Promise<{
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
  }> {
    try {
      logger.info(`Getting flood alerts for province: ${province}`);

      // Get weather alerts
      const weatherAlerts = await weatherService.getWeatherAlerts(province);

      // Get hydro data for flood monitoring stations
      const hydroData = await vietnamGovService.getHydroData(province);

      const alerts: any[] = [];

      // Process weather alerts
      if (weatherAlerts?.alerts) {
        weatherAlerts.alerts.forEach((alert: any) => {
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

      // Process hydro alerts (water levels above warning)
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
        } else if (
          latestMeasurement &&
          latestMeasurement.water_level >= station.flood_levels.alert
        ) {
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
    } catch (error: any) {
      logger.error(`Error getting flood alerts for ${province}:`, error.message);
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

  private async assessWeatherRisk(
    location: Location
  ): Promise<FloodRiskAssessment['factors']['weather_risk']> {
    try {
      const locationString = location.name || `${location.latitude},${location.longitude}`;

      // Get current weather
      const currentWeather = await weatherService.getCurrentWeather(locationString);

      // Get forecast
      const forecast = await weatherService.getWeatherForecast(locationString, 5);

      // Calculate risk
      const weatherData = forecast || currentWeather;
      const weatherRisk = weatherData
        ? weatherService.calculateFloodRisk(weatherData)
        : { risk_score: 50, risk_level: 'medium', factors: ['No weather data available'] };

      return {
        score: weatherRisk.risk_score,
        level: weatherRisk.risk_level,
        factors: weatherRisk.factors,
        current_weather: currentWeather,
        forecast: forecast,
      };
    } catch (error) {
      logger.error('Error assessing weather risk:', error);
      return {
        score: 50, // Default medium risk
        level: 'medium',
        factors: ['Unable to assess weather conditions'],
        current_weather: null,
        forecast: null,
      };
    }
  }

  private async assessTerrainRisk(
    location: Location
  ): Promise<FloodRiskAssessment['factors']['terrain_risk']> {
    try {
      const factors = await elevationService.getFloodRiskFactors(
        location.latitude,
        location.longitude
      );

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

      const vulnerability = elevationService.analyzeTerrainVulnerability(factors);

      return {
        score: vulnerability.vulnerability_score,
        level:
          vulnerability.vulnerability_score > 60
            ? 'high'
            : vulnerability.vulnerability_score > 30
            ? 'medium'
            : 'low',
        elevation: factors.elevation,
        slope: factors.slope,
        proximity_to_water: factors.proximity_to_water,
        factors: vulnerability.risk_factors,
      };
    } catch (error) {
      logger.error('Error assessing terrain risk:', error);
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

  private async assessInfrastructureRisk(
    location: Location
  ): Promise<FloodRiskAssessment['factors']['infrastructure_risk']> {
    try {
      // Get infrastructure within 5km radius
      const buffer = 0.045; // Approximate 5km in degrees
      const bbox = [
        location.longitude - buffer,
        location.latitude - buffer,
        location.longitude + buffer,
        location.latitude + buffer,
      ] as [number, number, number, number];

      const infrastructure = await openStreetMapService.getInfrastructureData(...bbox);

      if (!infrastructure) {
        return {
          score: 50,
          level: 'medium',
          factors: ['Unable to assess infrastructure'],
          infrastructure_count: { total: 0 },
        };
      }

      const vulnerability = openStreetMapService.analyzeFloodVulnerability(infrastructure);

      return {
        score: vulnerability.vulnerability_score,
        level:
          vulnerability.vulnerability_score > 60
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
          total:
            infrastructure.rivers.length +
            infrastructure.water_bodies.length +
            infrastructure.drainage_channels.length +
            infrastructure.roads.length +
            infrastructure.buildings.length +
            infrastructure.flood_defenses.length,
        },
      };
    } catch (error) {
      logger.error('Error assessing infrastructure risk:', error);
      return {
        score: 50,
        level: 'medium',
        factors: ['Unable to assess infrastructure'],
        infrastructure_count: { total: 0 },
      };
    }
  }

  private async assessHistoricalRisk(
    location: Location
  ): Promise<FloodRiskAssessment['factors']['historical_risk']> {
    try {
      const province = location.province || 'Unknown';

      // Get disaster history
      const disasters = await vietnamGovService.getDisasterHistory(province, 'flood');

      // Analyze historical risk
      const analysis = vietnamGovService.analyzeHistoricalFloodRisk(province);

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
    } catch (error) {
      logger.error('Error assessing historical risk:', error);
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

  private async assessPopulationRisk(
    location: Location
  ): Promise<FloodRiskAssessment['factors']['population_risk']> {
    try {
      const province = location.province || 'Unknown';

      const densityData = await vietnamGovService.getPopulationDensity(province);

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
        level:
          densityData.vulnerability_score > 60
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
    } catch (error) {
      logger.error('Error assessing population risk:', error);
      return {
        score: 30,
        level: 'low',
        population_density: 0,
        urban_percentage: 0,
        factors: ['No population data available'],
      };
    }
  }

  private calculateRiskLevel(score: number): FloodRiskAssessment['risk_level'] {
    if (score >= 80) return 'extreme';
    if (score >= 60) return 'very_high';
    if (score >= 40) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }

  private calculateConfidenceLevel(dataAvailability: boolean[]): 'low' | 'medium' | 'high' {
    const availableCount = dataAvailability.filter(Boolean).length;
    const totalCount = dataAvailability.length;

    if (availableCount >= totalCount * 0.8) return 'high';
    if (availableCount >= totalCount * 0.5) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    weatherRisk: any,
    terrainRisk: any,
    infrastructureRisk: any,
    historicalRisk: any,
    populationRisk: any,
    overallScore: number
  ): FloodRiskAssessment['recommendations'] {
    const immediateActions: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    const preparedness: string[] = [];

    // Immediate actions based on overall risk
    if (overallScore >= 80) {
      immediateActions.push(
        'Immediate evacuation of high-risk areas',
        'Activate emergency operations center',
        'Deploy emergency response teams',
        'Close roads and evacuate vehicles'
      );
    } else if (overallScore >= 60) {
      immediateActions.push(
        'Monitor water levels continuously',
        'Prepare emergency supplies',
        'Alert vulnerable populations'
      );
    }

    // Weather-based recommendations
    if (weatherRisk.score >= 60) {
      shortTerm.push('Monitor weather forecasts closely');
      preparedness.push('Prepare emergency weather radio');
    }

    // Terrain-based recommendations
    if (terrainRisk.score >= 60) {
      longTerm.push('Consider property elevation or relocation');
      preparedness.push('Create family emergency plan');
    }

    // Infrastructure-based recommendations
    if (infrastructureRisk.score >= 60) {
      longTerm.push('Improve drainage infrastructure');
      shortTerm.push('Clear drains and stormwater systems');
    }

    // Historical-based recommendations
    if (historicalRisk.score >= 60) {
      preparedness.push('Learn from past flood events');
      longTerm.push('Implement flood-resistant building codes');
    }

    // Population-based recommendations
    if (populationRisk.score >= 60) {
      preparedness.push('Develop community flood preparedness programs');
      shortTerm.push('Organize community evacuation drills');
    }

    return {
      immediate_actions:
        immediateActions.length > 0 ? immediateActions : ['Monitor local conditions'],
      short_term: shortTerm.length > 0 ? shortTerm : ['Stay informed about weather conditions'],
      long_term: longTerm.length > 0 ? longTerm : ['Consider flood insurance'],
      preparedness: preparedness.length > 0 ? preparedness : ['Create emergency contact list'],
    };
  }

  private getRecommendedActions(alertType: string, severity: string): string[] {
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

    return (actions as any)[alertType]?.[severity] || ['Stay alert and monitor local conditions'];
  }

  /**
   * Get risk assessment summary for a region
   */
  async getRegionalRiskSummary(province: string): Promise<{
    province: string;
    assessment_date: string;
    overall_risk_level: string;
    high_risk_areas: number;
    total_assessed_areas: number;
    recent_alerts: number;
    recommendations: string[];
  } | null> {
    try {
      // Get alerts for the province
      const alerts = await this.getFloodAlerts(province);

      // Mock regional assessment (would need actual ward/district data)
      const mockSummary = {
        province,
        assessment_date: new Date().toISOString(),
        overall_risk_level:
          alerts.summary.high_severity_count > 5
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
    } catch (error: any) {
      logger.error(`Error getting regional risk summary for ${province}:`, error.message);
      return null;
    }
  }
}

export default new FloodRiskAssessmentService();
