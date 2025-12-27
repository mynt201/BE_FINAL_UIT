import axios, { AxiosResponse } from 'axios';
import { logger } from '../../utils/logger';

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
    water_level: number; // meters
    flow_rate: number; // m³/s
    temperature: number; // °C
    rainfall_24h: number; // mm
  }>;
  flood_levels: {
    warning: number; // water level for warning
    alert: number; // water level for alert
    danger: number; // water level for danger
  };
  last_updated: string;
}

class VietnamGovernmentService {
  private populationApiUrl: string;
  private administrativeApiUrl: string;
  private disasterApiUrl: string;
  private hydroApiUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for government data

  constructor() {
    // These are example URLs - in reality, Vietnam government APIs may have different endpoints
    // You would need to use actual government API endpoints
    this.populationApiUrl = 'https://api.thongke.gov.vn'; // General Statistics Office
    this.administrativeApiUrl = 'https://api.dancu.gov.vn'; // Ministry of Home Affairs
    this.disasterApiUrl = 'https://api.cc.gov.vn'; // Central Committee for Flood and Storm Control
    this.hydroApiUrl = 'https://api.cc.gov.vn'; // Hydro-meteorological data
  }

  /**
   * Get population data for administrative units
   */
  async getPopulationData(
    level: 'province' | 'district' | 'ward' = 'province',
    year: number = new Date().getFullYear()
  ): Promise<PopulationData[]> {
    try {
      const cacheKey = `population_${level}_${year}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // This is a mock implementation - replace with actual API calls
      // In reality, you would call actual Vietnamese government APIs

      logger.info(`Fetching population data for ${level} level, year ${year}`);

      // Mock data for demonstration - replace with real API calls
      const mockData: PopulationData[] = await this.getMockPopulationData(level, year);

      this.setCachedData(cacheKey, mockData);
      return mockData;

    } catch (error: any) {
      logger.error(`Error fetching population data:`, error.message);
      return [];
    }
  }

  /**
   * Get administrative units hierarchy
   */
  async getAdministrativeUnits(): Promise<AdministrativeUnit[]> {
    try {
      const cacheKey = 'admin_units';
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      logger.info('Fetching administrative units data');

      // Mock implementation - replace with real API calls
      const mockData: AdministrativeUnit[] = await this.getMockAdministrativeUnits();

      this.setCachedData(cacheKey, mockData);
      return mockData;

    } catch (error: any) {
      logger.error('Error fetching administrative units:', error.message);
      return [];
    }
  }

  /**
   * Get historical disaster data
   */
  async getDisasterHistory(
    province?: string,
    disasterType?: 'flood' | 'storm' | 'drought' | 'landslide',
    yearRange?: { start: number; end: number }
  ): Promise<DisasterHistory[]> {
    try {
      const cacheKey = `disaster_${province || 'all'}_${disasterType || 'all'}_${yearRange?.start || 'all'}-${yearRange?.end || 'all'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      logger.info(`Fetching disaster history data${province ? ` for ${province}` : ''}`);

      // Mock implementation - replace with real API calls
      const mockData: DisasterHistory[] = await this.getMockDisasterHistory(province, disasterType, yearRange);

      this.setCachedData(cacheKey, mockData);
      return mockData;

    } catch (error: any) {
      logger.error('Error fetching disaster history:', error.message);
      return [];
    }
  }

  /**
   * Get hydrological monitoring data
   */
  async getHydroData(province?: string): Promise<HydroData[]> {
    try {
      const cacheKey = `hydro_${province || 'all'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      logger.info(`Fetching hydrological data${province ? ` for ${province}` : ''}`);

      // Mock implementation - replace with real API calls
      const mockData: HydroData[] = await this.getMockHydroData(province);

      this.setCachedData(cacheKey, mockData);
      return mockData;

    } catch (error: any) {
      logger.error('Error fetching hydrological data:', error.message);
      return [];
    }
  }

  /**
   * Analyze flood risk based on historical data and population
   */
  analyzeHistoricalFloodRisk(provinceName: string): {
    risk_score: number;
    historical_events: number;
    average_impact: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    recommendations: string[];
  } {
    // This would analyze real historical data
    // For now, return mock analysis

    const mockHistoricalEvents = Math.floor(Math.random() * 20) + 5;
    const mockAverageImpact = Math.floor(Math.random() * 50000) + 10000;
    const trends = ['increasing', 'stable', 'decreasing'] as const;
    const mockTrend = trends[Math.floor(Math.random() * trends.length)];

    let riskScore = 0;
    const recommendations: string[] = [];

    // Calculate risk based on historical data
    if (mockHistoricalEvents > 15) {
      riskScore += 30;
      recommendations.push('Implement comprehensive flood monitoring system');
    } else if (mockHistoricalEvents > 10) {
      riskScore += 20;
      recommendations.push('Enhance flood warning systems');
    }

    if (mockAverageImpact > 30000) {
      riskScore += 25;
      recommendations.push('Develop emergency response plans');
    }

    if (mockTrend === 'increasing') {
      riskScore += 15;
      recommendations.push('Conduct regular flood risk assessments');
    }

    return {
      risk_score: Math.min(riskScore, 100),
      historical_events: mockHistoricalEvents,
      average_impact: mockAverageImpact,
      trend: mockTrend as 'increasing' | 'stable' | 'decreasing',
      recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring flood patterns']
    };
  }

  /**
   * Get population density for flood vulnerability assessment
   */
  async getPopulationDensity(provinceName: string): Promise<{
    province: string;
    total_population: number;
    area_km2: number;
    density_per_km2: number;
    urban_percentage: number;
    vulnerability_score: number;
  } | null> {
    try {
      const populationData = await this.getPopulationData('province');

      const provinceData = populationData.find(p =>
        p.province_name.toLowerCase().includes(provinceName.toLowerCase())
      );

      if (!provinceData) {
        return null;
      }

      // Mock additional data
      const urbanPercentage = Math.floor(Math.random() * 40) + 20; // 20-60%

      // Calculate vulnerability based on density and urbanization
      let vulnerabilityScore = 0;

      if (provinceData.density_per_km2 > 1000) {
        vulnerabilityScore += 30; // Very high density
      } else if (provinceData.density_per_km2 > 500) {
        vulnerabilityScore += 20; // High density
      } else if (provinceData.density_per_km2 > 200) {
        vulnerabilityScore += 10; // Moderate density
      }

      if (urbanPercentage > 50) {
        vulnerabilityScore += 20; // Highly urbanized
      } else if (urbanPercentage > 30) {
        vulnerabilityScore += 10; // Moderately urbanized
      }

      return {
        province: provinceData.province_name,
        total_population: provinceData.population,
        area_km2: provinceData.area_km2,
        density_per_km2: provinceData.density_per_km2,
        urban_percentage: urbanPercentage,
        vulnerability_score: Math.min(vulnerabilityScore, 100)
      };

    } catch (error: any) {
      logger.error(`Error getting population density for ${provinceName}:`, error.message);
      return null;
    }
  }

  // Mock data methods - replace with real API calls

  private async getMockPopulationData(level: string, year: number): Promise<PopulationData[]> {
    // Mock data for major Vietnamese provinces
    const provinces = [
      { code: '01', name: 'Hà Nội', population: 8246540, area: 3358.6 },
      { code: '79', name: 'Hồ Chí Minh', population: 9227948, area: 2061.4 },
      { code: '48', name: 'Đà Nẵng', population: 1191381, area: 1284.9 },
      { code: '92', name: 'Cần Thơ', population: 1248408, area: 1439.2 },
      { code: '31', name: 'Hải Phòng', population: 2029264, area: 1523.9 },
    ];

    return provinces.map(province => ({
      province_code: province.code,
      province_name: province.name,
      population: province.population,
      area_km2: province.area,
      density_per_km2: Math.round(province.population / province.area),
      year: year,
      source: 'General Statistics Office of Vietnam (Mock Data)'
    }));
  }

  private async getMockAdministrativeUnits(): Promise<AdministrativeUnit[]> {
    // Mock administrative units
    return [
      {
        id: 'prov_01',
        name: 'Hà Nội',
        level: 'province',
        code: '01',
        population: 8246540,
        area: 3358.6,
        coordinates: { lat: 21.0285, lng: 105.8542 }
      },
      {
        id: 'prov_79',
        name: 'Hồ Chí Minh',
        level: 'province',
        code: '79',
        population: 9227948,
        area: 2061.4,
        coordinates: { lat: 10.8231, lng: 106.6297 }
      }
    ];
  }

  private async getMockDisasterHistory(
    province?: string,
    disasterType?: string,
    yearRange?: { start: number; end: number }
  ): Promise<DisasterHistory[]> {
    const disasters: DisasterHistory[] = [
      {
        id: 'flood_2020_hanoi',
        type: 'flood',
        location: {
          province: 'Hà Nội',
          coordinates: { lat: 21.0285, lng: 105.8542 }
        },
        date: '2020-08-15',
        severity: 'high',
        affected_population: 50000,
        economic_damage: 50000000,
        deaths: 2,
        description: 'Heavy monsoon flooding affecting northern districts',
        response_actions: ['Emergency evacuation', 'Food distribution', 'Medical aid'],
        source: 'Central Committee for Flood and Storm Control'
      },
      {
        id: 'storm_2018_danang',
        type: 'storm',
        location: {
          province: 'Đà Nẵng',
          coordinates: { lat: 16.0544, lng: 108.2022 }
        },
        date: '2018-09-16',
        severity: 'severe',
        affected_population: 80000,
        economic_damage: 100000000,
        deaths: 5,
        description: 'Tropical storm Son-Tinh causing widespread damage',
        response_actions: ['Search and rescue operations', 'Temporary housing', 'Infrastructure repair'],
        source: 'Ministry of Agriculture and Rural Development'
      }
    ];

    let filtered = disasters;

    if (province) {
      filtered = filtered.filter(d => d.location.province.toLowerCase().includes(province.toLowerCase()));
    }

    if (disasterType) {
      filtered = filtered.filter(d => d.type === disasterType);
    }

    return filtered;
  }

  private async getMockHydroData(province?: string): Promise<HydroData[]> {
    const stations: HydroData[] = [
      {
        station_id: 'hydro_hanoi_red',
        station_name: 'Hà Nội - Sông Hồng',
        river_name: 'Sông Hồng',
        location: {
          province: 'Hà Nội',
          coordinates: { lat: 21.0285, lng: 105.8542 }
        },
        measurements: [
          {
            date: new Date().toISOString().split('T')[0] as string,
            water_level: 3.2,
            flow_rate: 1200,
            temperature: 28.5,
            rainfall_24h: 45.2
          }
        ],
        flood_levels: {
          warning: 4.0,
          alert: 6.0,
          danger: 8.0
        },
        last_updated: new Date().toISOString()
      },
      {
        station_id: 'hydro_hcm_sai_gon',
        station_name: 'HCM - Sông Sài Gòn',
        river_name: 'Sông Sài Gòn',
        location: {
          province: 'Hồ Chí Minh',
          coordinates: { lat: 10.8231, lng: 106.6297 }
        },
        measurements: [
          {
            date: new Date().toISOString().split('T')[0] as string,
            water_level: 1.8,
            flow_rate: 800,
            temperature: 30.2,
            rainfall_24h: 12.5
          }
        ],
        flood_levels: {
          warning: 2.5,
          alert: 4.0,
          danger: 5.5
        },
        last_updated: new Date().toISOString()
      }
    ];

    if (province) {
      return stations.filter(s => s.location.province.toLowerCase().includes(province.toLowerCase()));
    }

    return stations;
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Clean up old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Vietnam Government API cache cleared');
  }
}

export default new VietnamGovernmentService();
