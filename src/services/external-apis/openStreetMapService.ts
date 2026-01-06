interface InfrastructureFeature {
    id: string;
    type: 'river' | 'road' | 'railway' | 'building' | 'water_body' | 'drainage';
    name?: string;
    coordinates: Array<[number, number]>;
    properties: Record<string, any>;
    osm_tags: Record<string, string>;
}

interface FloodInfrastructure {
    rivers: InfrastructureFeature[];
    water_bodies: InfrastructureFeature[];
    drainage_channels: InfrastructureFeature[];
    roads: InfrastructureFeature[];
    buildings: InfrastructureFeature[];
    flood_defenses: InfrastructureFeature[];
}

class OpenStreetMapService {
    private overpassUrl: string;
    private nominatimUrl: string;
    private cache: Map<string, { data: any; timestamp: number }>;
    private readonly CACHE_DURATION: number = 24 * 60 * 60 * 1000; // 24 hours

    constructor() {
        this.overpassUrl = 'https://overpass-api.de/api/interpreter';
        this.nominatimUrl = 'https://nominatim.openstreetmap.org';
        this.cache = new Map();
    }

    async searchLocations(query: string, limit: number = 10): Promise<Array<{
        place_id: number;
        osm_id: number;
        osm_type: string;
        licence: string;
        lat: string;
        lon: string;
        class: string;
        type: string;
        place_rank: number;
        importance: number;
        addresstype: string;
        name: string;
        display_name: string;
        boundingbox: string[];
    }>> {
        try {
            const url = `${this.nominatimUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Nominatim API error: ${response.status}`);
            }

            const data = await response.json() as Array<{
                place_id: number;
                osm_id: number;
                osm_type: string;
                licence: string;
                lat: string;
                lon: string;
                class: string;
                type: string;
                place_rank: number;
                importance: number;
                addresstype: string;
                name: string;
                display_name: string;
                boundingbox: string[];
            }>;
            return data;
        } catch (error) {
            console.error('Error searching locations:', error);
            return [];
        }
    }

    async getInfrastructureData(bbox: [number, number, number, number], types?: string[]): Promise<FloodInfrastructure> {
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

    async getFloodRiskInfrastructure(latitude: number, longitude: number, radiusKm: number = 5): Promise<FloodInfrastructure> {
        // Calculate bounding box
        const latDiff = radiusKm / 111; // Approximate degrees per km
        const lngDiff = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

        const bbox: [number, number, number, number] = [
            longitude - lngDiff,
            latitude - latDiff,
            longitude + lngDiff,
            latitude + latDiff
        ];

        return await this.getInfrastructureData(bbox, ['waterway', 'natural', 'highway', 'building']);
    }

    analyzeFloodInfrastructure(infrastructure: FloodInfrastructure): {
        flood_risk_score: number;
        vulnerable_elements: string[];
        protective_elements: string[];
        recommendations: string[];
    } {
        let flood_risk_score = 0;
        const vulnerable_elements: string[] = [];
        const protective_elements: string[] = [];
        const recommendations: string[] = [];

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
        } else {
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

    async getAddressDetails(latitude: number, longitude: number): Promise<any> {
        try {
            const url = `${this.nominatimUrl}/reverse?format=json&lat=${latitude}&lon=${longitude}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Nominatim API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting address details:', error);
            return null;
        }
    }

    async analyzeFloodVulnerability(infrastructure: FloodInfrastructure): Promise<any> {
        // Stub implementation
        return this.analyzeFloodInfrastructure(infrastructure);
    }

    clearCache(): void {
        this.cache.clear();
    }
}

export default OpenStreetMapService;
