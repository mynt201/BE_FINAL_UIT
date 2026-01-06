"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ElevationService {
    constructor() {
        this.CACHE_DURATION = 60 * 60 * 1000; // 1 hour
        this.openElevationUrl = 'https://api.open-elevation.com/api/v1/lookup';
        this.cache = new Map();
    }
    async getElevation(latitude, longitude) {
        try {
            const points = [{ latitude, longitude }];
            const elevations = await this.getElevations(points);
            return elevations.length > 0 ? elevations[0].elevation : null;
        }
        catch (error) {
            console.error('Error getting elevation:', error);
            return null;
        }
    }
    async getElevations(points) {
        try {
            const locations = points.map(point => `${point.latitude},${point.longitude}`).join('|');
            const url = `${this.openElevationUrl}?locations=${locations}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Elevation API error: ${response.status}`);
            }
            const data = await response.json();
            return data.results.map((result, index) => ({
                latitude: points[index].latitude,
                longitude: points[index].longitude,
                elevation: result.elevation
            }));
        }
        catch (error) {
            console.error('Error getting elevations:', error);
            return [];
        }
    }
    async getElevationProfile(startLat, startLng, endLat, endLng, numPoints = 10) {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const fraction = i / (numPoints - 1);
            const lat = startLat + (endLat - startLat) * fraction;
            const lng = startLng + (endLng - startLng) * fraction;
            points.push({ latitude: lat, longitude: lng });
        }
        return await this.getElevations(points);
    }
    calculateSlope(elevation1, elevation2, distance) {
        if (distance === 0)
            return 0;
        return Math.abs((elevation2 - elevation1) / distance) * 100; // slope as percentage
    }
    async getFloodRiskFactors(latitude, longitude) {
        try {
            const elevation = await this.getElevation(latitude, longitude);
            if (elevation === null)
                return null;
            // Stub values for other factors
            return {
                elevation,
                slope: 0, // Would need additional calculation
                proximity_to_water: 1000, // Stub distance in meters
                soil_type: 'unknown',
                land_use: 'unknown'
            };
        }
        catch (error) {
            console.error('Error getting flood risk factors:', error);
            return null;
        }
    }
    analyzeTerrainVulnerability(factors) {
        let vulnerability_score = 0;
        const risk_factors = [];
        const recommendations = [];
        // Elevation analysis
        if (factors.elevation < 5) {
            vulnerability_score += 3;
            risk_factors.push('Very low elevation');
            recommendations.push('Implement flood barriers and elevated structures');
        }
        else if (factors.elevation < 10) {
            vulnerability_score += 2;
            risk_factors.push('Low elevation');
            recommendations.push('Regular monitoring and early warning systems');
        }
        // Slope analysis
        if (factors.slope > 20) {
            vulnerability_score += 1;
            risk_factors.push('Steep slope');
            recommendations.push('Erosion control measures');
        }
        // Proximity to water
        if (factors.proximity_to_water < 100) {
            vulnerability_score += 3;
            risk_factors.push('Very close to water body');
            recommendations.push('Flood-proofing of buildings');
        }
        else if (factors.proximity_to_water < 500) {
            vulnerability_score += 1;
            risk_factors.push('Near water body');
            recommendations.push('Regular drainage maintenance');
        }
        return {
            vulnerability_score: Math.min(vulnerability_score, 5),
            risk_factors,
            recommendations
        };
    }
    async batchFloodRiskAssessment(locations) {
        const results = [];
        for (const location of locations) {
            const elevation_data = await this.getFloodRiskFactors(location.latitude, location.longitude);
            const vulnerability = elevation_data ? this.analyzeTerrainVulnerability(elevation_data) : null;
            results.push({
                location,
                elevation_data,
                vulnerability
            });
        }
        return results;
    }
    generateCacheKey(latitude, longitude) {
        return `elevation_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
    }
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }
    setCachedData(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
    clearCache() {
        this.cache.clear();
    }
}
exports.default = ElevationService;
//# sourceMappingURL=elevationService.js.map