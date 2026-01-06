"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OpenStreetMapService {
    constructor() {
        this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
        this.overpassUrl = 'https://overpass-api.de/api/interpreter';
        this.nominatimUrl = 'https://nominatim.openstreetmap.org';
        this.cache = new Map();
    }
    async searchLocations(query, limit = 10) {
        try {
            const url = `${this.nominatimUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Nominatim API error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error('Error searching locations:', error);
            return [];
        }
    }
    async getInfrastructureData(bbox, types) {
        // Stub implementation - would query Overpass API for infrastructure data
        return {
            rivers: [],
            water_bodies: [],
            drainage_channels: [],
            roads: [],
            buildings: [],
            flood_defenses: []
        };
    }
    async getFloodRiskInfrastructure(latitude, longitude, radiusKm = 5) {
        // Calculate bounding box
        const latDiff = radiusKm / 111; // Approximate degrees per km
        const lngDiff = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
        const bbox = [
            longitude - lngDiff,
            latitude - latDiff,
            longitude + lngDiff,
            latitude + latDiff
        ];
        return await this.getInfrastructureData(bbox, ['waterway', 'natural', 'highway', 'building']);
    }
    analyzeFloodInfrastructure(infrastructure) {
        let flood_risk_score = 0;
        const vulnerable_elements = [];
        const protective_elements = [];
        const recommendations = [];
        // Analyze water bodies proximity
        if (infrastructure.rivers.length > 0) {
            flood_risk_score += 2;
            vulnerable_elements.push('Rivers nearby');
            recommendations.push('Regular river level monitoring');
        }
        if (infrastructure.water_bodies.length > 0) {
            flood_risk_score += 1;
            vulnerable_elements.push('Water bodies nearby');
        }
        // Analyze drainage
        if (infrastructure.drainage_channels.length === 0) {
            flood_risk_score += 2;
            vulnerable_elements.push('Limited drainage infrastructure');
            recommendations.push('Improve drainage systems');
        }
        else {
            protective_elements.push('Drainage systems present');
        }
        // Analyze roads
        if (infrastructure.roads.length > 0) {
            protective_elements.push('Road infrastructure');
        }
        // Analyze buildings
        if (infrastructure.buildings.length > 10) {
            flood_risk_score += 1;
            vulnerable_elements.push('High building density');
            recommendations.push('Implement urban flood management');
        }
        return {
            flood_risk_score: Math.min(flood_risk_score, 5),
            vulnerable_elements,
            protective_elements,
            recommendations
        };
    }
    async getAddressDetails(latitude, longitude) {
        try {
            const url = `${this.nominatimUrl}/reverse?format=json&lat=${latitude}&lon=${longitude}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Nominatim API error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error('Error getting address details:', error);
            return null;
        }
    }
    async analyzeFloodVulnerability(infrastructure) {
        // Stub implementation
        return this.analyzeFloodInfrastructure(infrastructure);
    }
    clearCache() {
        this.cache.clear();
    }
}
exports.default = OpenStreetMapService;
//# sourceMappingURL=openStreetMapService.js.map