"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WeatherAPIService {
    constructor() {
        this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
        this.apiKey = process.env.WEATHER_API_KEY || '';
        this.baseUrl = 'https://api.weatherapi.com/v1';
        this.cache = new Map();
    }
    async getCurrentWeather(location) {
        try {
            const url = `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&aqi=no`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error('Error fetching current weather:', error);
            return null;
        }
    }
    async getWeatherForecast(location, days = 7) {
        try {
            const url = `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&days=${days}&aqi=no&alerts=no`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error('Error fetching weather forecast:', error);
            return null;
        }
    }
    async getHistoricalWeather(location, date) {
        try {
            const url = `${this.baseUrl}/history.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&dt=${date}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error('Error fetching historical weather:', error);
            return null;
        }
    }
    async searchLocations(query) {
        try {
            const url = `${this.baseUrl}/search.json?key=${this.apiKey}&q=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error('Error searching locations:', error);
            return null;
        }
    }
    async getWeatherAlerts(location) {
        // Stub implementation
        return null;
    }
    async getHydroData(location) {
        // Stub implementation for hydrological data
        return null;
    }
    calculateFloodRisk(weatherData) {
        // Simple flood risk calculation based on rainfall and humidity
        const rainfall = weatherData.current.precip_mm;
        const humidity = weatherData.current.humidity;
        let risk_score = 0;
        const factors = [];
        if (rainfall > 50) {
            risk_score += 3;
            factors.push('Heavy rainfall');
        }
        else if (rainfall > 25) {
            risk_score += 2;
            factors.push('Moderate rainfall');
        }
        else if (rainfall > 10) {
            risk_score += 1;
            factors.push('Light rainfall');
        }
        if (humidity > 90) {
            risk_score += 2;
            factors.push('Very high humidity');
        }
        else if (humidity > 80) {
            risk_score += 1;
            factors.push('High humidity');
        }
        let risk_level;
        let recommendation;
        if (risk_score >= 4) {
            risk_level = 'very_high';
            recommendation = 'High flood risk. Take immediate precautions and monitor water levels closely.';
        }
        else if (risk_score >= 3) {
            risk_level = 'high';
            recommendation = 'Elevated flood risk. Prepare emergency supplies and stay alert.';
        }
        else if (risk_score >= 2) {
            risk_level = 'medium';
            recommendation = 'Moderate flood risk. Keep updated with weather reports.';
        }
        else {
            risk_level = 'low';
            recommendation = 'Low flood risk. Normal activities can continue.';
        }
        return {
            risk_level,
            risk_score,
            factors,
            recommendation
        };
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
exports.default = WeatherAPIService;
//# sourceMappingURL=weatherService.js.map