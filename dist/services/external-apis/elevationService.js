"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const logger_1 = require("../../utils/logger");
class ElevationService {
    openElevationUrl;
    cache = new Map();
    CACHE_DURATION = 24 * 60 * 60 * 1000;
    constructor() {
        this.openElevationUrl = 'https://api.open-elevation.com/api/v1/lookup';
    }
    async getElevation(latitude, longitude) {
        try {
            const elevations = await this.getElevations([{ latitude, longitude }]);
            return elevations.length > 0 ? elevations[0]?.elevation ?? null : null;
        }
        catch (error) {
            logger_1.logger.error(`Error getting elevation for (${latitude}, ${longitude}):`, error.message);
            return null;
        }
    }
    async getElevations(points) {
        try {
            if (points.length === 0) {
                return [];
            }
            const cacheKey = this.generateCacheKey(points);
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            const locations = points.map(point => `${point.latitude},${point.longitude}`).join('|');
            const params = {
                locations: locations
            };
            logger_1.logger.info(`Fetching elevation data for ${points.length} points`);
            const response = await axios_1.default.get(this.openElevationUrl, { params });
            if (!response.data?.results) {
                throw new Error('Invalid response from elevation API');
            }
            const elevationData = response.data.results.map((result, index) => ({
                latitude: points[index]?.latitude || 0,
                longitude: points[index]?.longitude || 0,
                elevation: result.elevation
            }));
            this.setCachedData(cacheKey, elevationData);
            return elevationData;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching elevation data:`, error.message);
            if (error.response?.status === 429) {
                logger_1.logger.warn('Elevation API rate limit exceeded');
            }
            else if (error.response?.status === 400) {
                logger_1.logger.warn('Invalid coordinates provided to elevation API');
            }
            return [];
        }
    }
    async getElevationProfile(startLat, startLng, endLat, endLng, numPoints = 20) {
        try {
            const points = [];
            for (let i = 0; i < numPoints; i++) {
                const fraction = i / (numPoints - 1);
                const lat = startLat + (endLat - startLat) * fraction;
                const lng = startLng + (endLng - startLng) * fraction;
                points.push({ latitude: lat, longitude: lng });
            }
            return await this.getElevations(points);
        }
        catch (error) {
            logger_1.logger.error(`Error getting elevation profile:`, error.message);
            return [];
        }
    }
    calculateSlope(elevation1, elevation2, distance) {
        if (distance === 0)
            return 0;
        return Math.abs(elevation2 - elevation1) / distance * 100;
    }
    async getFloodRiskFactors(latitude, longitude) {
        try {
            const elevation = await this.getElevation(latitude, longitude);
            if (elevation === null) {
                return null;
            }
            const surroundingPoints = [
                { latitude: latitude + 0.001, longitude: longitude },
                { latitude: latitude - 0.001, longitude: longitude },
                { latitude: latitude, longitude: longitude + 0.001 },
                { latitude: latitude, longitude: longitude - 0.001 },
            ];
            const surroundingElevations = await this.getElevations(surroundingPoints);
            let totalSlope = 0;
            let slopeCount = 0;
            if (surroundingElevations.length >= 4) {
                const pointDistance = 111;
                surroundingElevations.forEach(surrElevation => {
                    const slope = this.calculateSlope(elevation, surrElevation.elevation, pointDistance);
                    totalSlope += slope;
                    slopeCount++;
                });
            }
            const averageSlope = slopeCount > 0 ? totalSlope / slopeCount : 0;
            let proximityToWater = 0;
            if (elevation < 10) {
                proximityToWater = 0.8;
            }
            else if (elevation < 50) {
                proximityToWater = 0.6;
            }
            else if (elevation < 100) {
                proximityToWater = 0.3;
            }
            else {
                proximityToWater = 0.1;
            }
            return {
                elevation,
                slope: averageSlope,
                proximity_to_water: proximityToWater,
                soil_type: 'unknown',
                land_use: 'unknown'
            };
        }
        catch (error) {
            logger_1.logger.error(`Error calculating flood risk factors:`, error.message);
            return null;
        }
    }
    analyzeTerrainVulnerability(factors) {
        let vulnerabilityScore = 0;
        const riskFactors = [];
        const recommendations = [];
        if (factors.elevation < 5) {
            vulnerabilityScore += 40;
            riskFactors.push('Very low elevation (< 5m)');
            recommendations.push('Consider elevated building foundations');
            recommendations.push('Install flood barriers or levees');
        }
        else if (factors.elevation < 10) {
            vulnerabilityScore += 25;
            riskFactors.push('Low elevation (5-10m)');
            recommendations.push('Prepare flood evacuation plan');
        }
        else if (factors.elevation < 20) {
            vulnerabilityScore += 10;
            riskFactors.push('Moderate elevation (10-20m)');
            recommendations.push('Monitor weather forecasts closely');
        }
        if (factors.slope > 20) {
            vulnerabilityScore += 15;
            riskFactors.push('Steep terrain slope');
            recommendations.push('Implement erosion control measures');
        }
        else if (factors.slope > 10) {
            vulnerabilityScore += 8;
            riskFactors.push('Moderate terrain slope');
        }
        if (factors.proximity_to_water > 0.7) {
            vulnerabilityScore += 30;
            riskFactors.push('Very close to water bodies');
            recommendations.push('Install flood detection sensors');
            recommendations.push('Create emergency evacuation routes');
        }
        else if (factors.proximity_to_water > 0.5) {
            vulnerabilityScore += 20;
            riskFactors.push('Close to water bodies');
            recommendations.push('Prepare sandbags and flood barriers');
        }
        else if (factors.proximity_to_water > 0.3) {
            vulnerabilityScore += 10;
            riskFactors.push('Moderately close to water bodies');
        }
        vulnerabilityScore = Math.min(vulnerabilityScore, 100);
        return {
            vulnerability_score: vulnerabilityScore,
            risk_factors: riskFactors.length > 0 ? riskFactors : ['No significant terrain risk factors'],
            recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring local conditions']
        };
    }
    async batchFloodRiskAssessment(locations) {
        const results = [];
        const batchSize = 10;
        for (let i = 0; i < locations.length; i += batchSize) {
            const batch = locations.slice(i, i + batchSize);
            const batchPromises = batch.map(async (location) => {
                const elevationData = await this.getFloodRiskFactors(location.latitude, location.longitude);
                const vulnerability = elevationData ? this.analyzeTerrainVulnerability(elevationData) : null;
                return {
                    location,
                    elevation_data: elevationData,
                    vulnerability
                };
            });
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            if (i + batchSize < locations.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return results;
    }
    generateCacheKey(points) {
        const coords = points.map(p => `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`).join('|');
        return `elevation_${coords}`;
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
        if (this.cache.size > 200) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
    }
    clearCache() {
        this.cache.clear();
        logger_1.logger.info('Elevation API cache cleared');
    }
}
exports.default = new ElevationService();
//# sourceMappingURL=elevationService.js.map