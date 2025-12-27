"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../utils/logger");
class VietnamGovernmentService {
    populationApiUrl;
    administrativeApiUrl;
    disasterApiUrl;
    hydroApiUrl;
    cache = new Map();
    CACHE_DURATION = 24 * 60 * 60 * 1000;
    constructor() {
        this.populationApiUrl = 'https://api.thongke.gov.vn';
        this.administrativeApiUrl = 'https://api.dancu.gov.vn';
        this.disasterApiUrl = 'https://api.cc.gov.vn';
        this.hydroApiUrl = 'https://api.cc.gov.vn';
    }
    async getPopulationData(level = 'province', year = new Date().getFullYear()) {
        try {
            const cacheKey = `population_${level}_${year}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            logger_1.logger.info(`Fetching population data for ${level} level, year ${year}`);
            const mockData = await this.getMockPopulationData(level, year);
            this.setCachedData(cacheKey, mockData);
            return mockData;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching population data:`, error.message);
            return [];
        }
    }
    async getAdministrativeUnits() {
        try {
            const cacheKey = 'admin_units';
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            logger_1.logger.info('Fetching administrative units data');
            const mockData = await this.getMockAdministrativeUnits();
            this.setCachedData(cacheKey, mockData);
            return mockData;
        }
        catch (error) {
            logger_1.logger.error('Error fetching administrative units:', error.message);
            return [];
        }
    }
    async getDisasterHistory(province, disasterType, yearRange) {
        try {
            const cacheKey = `disaster_${province || 'all'}_${disasterType || 'all'}_${yearRange?.start || 'all'}-${yearRange?.end || 'all'}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            logger_1.logger.info(`Fetching disaster history data${province ? ` for ${province}` : ''}`);
            const mockData = await this.getMockDisasterHistory(province, disasterType, yearRange);
            this.setCachedData(cacheKey, mockData);
            return mockData;
        }
        catch (error) {
            logger_1.logger.error('Error fetching disaster history:', error.message);
            return [];
        }
    }
    async getHydroData(province) {
        try {
            const cacheKey = `hydro_${province || 'all'}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            logger_1.logger.info(`Fetching hydrological data${province ? ` for ${province}` : ''}`);
            const mockData = await this.getMockHydroData(province);
            this.setCachedData(cacheKey, mockData);
            return mockData;
        }
        catch (error) {
            logger_1.logger.error('Error fetching hydrological data:', error.message);
            return [];
        }
    }
    analyzeHistoricalFloodRisk(provinceName) {
        const mockHistoricalEvents = Math.floor(Math.random() * 20) + 5;
        const mockAverageImpact = Math.floor(Math.random() * 50000) + 10000;
        const trends = ['increasing', 'stable', 'decreasing'];
        const mockTrend = trends[Math.floor(Math.random() * trends.length)];
        let riskScore = 0;
        const recommendations = [];
        if (mockHistoricalEvents > 15) {
            riskScore += 30;
            recommendations.push('Implement comprehensive flood monitoring system');
        }
        else if (mockHistoricalEvents > 10) {
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
            trend: mockTrend,
            recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring flood patterns']
        };
    }
    async getPopulationDensity(provinceName) {
        try {
            const populationData = await this.getPopulationData('province');
            const provinceData = populationData.find(p => p.province_name.toLowerCase().includes(provinceName.toLowerCase()));
            if (!provinceData) {
                return null;
            }
            const urbanPercentage = Math.floor(Math.random() * 40) + 20;
            let vulnerabilityScore = 0;
            if (provinceData.density_per_km2 > 1000) {
                vulnerabilityScore += 30;
            }
            else if (provinceData.density_per_km2 > 500) {
                vulnerabilityScore += 20;
            }
            else if (provinceData.density_per_km2 > 200) {
                vulnerabilityScore += 10;
            }
            if (urbanPercentage > 50) {
                vulnerabilityScore += 20;
            }
            else if (urbanPercentage > 30) {
                vulnerabilityScore += 10;
            }
            return {
                province: provinceData.province_name,
                total_population: provinceData.population,
                area_km2: provinceData.area_km2,
                density_per_km2: provinceData.density_per_km2,
                urban_percentage: urbanPercentage,
                vulnerability_score: Math.min(vulnerabilityScore, 100)
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting population density for ${provinceName}:`, error.message);
            return null;
        }
    }
    async getMockPopulationData(level, year) {
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
    async getMockAdministrativeUnits() {
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
    async getMockDisasterHistory(province, disasterType, yearRange) {
        const disasters = [
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
    async getMockHydroData(province) {
        const stations = [
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
                        date: new Date().toISOString().split('T')[0],
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
                        date: new Date().toISOString().split('T')[0],
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
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }
    setCachedData(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }
    clearCache() {
        this.cache.clear();
        logger_1.logger.info('Vietnam Government API cache cleared');
    }
}
exports.default = new VietnamGovernmentService();
//# sourceMappingURL=vietnamGovService.js.map