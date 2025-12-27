"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const logger_1 = require("../../utils/logger");
class WeatherAPIService {
    apiKey;
    baseUrl;
    cache = new Map();
    CACHE_DURATION = 10 * 60 * 1000;
    constructor() {
        this.apiKey = process.env.WEATHER_API_KEY || '';
        this.baseUrl = 'http://api.weatherapi.com/v1';
        if (!this.apiKey) {
            logger_1.logger.warn('Weather API key not configured. Weather services will not work.');
        }
    }
    async getCurrentWeather(location) {
        try {
            if (!this.apiKey) {
                throw new Error('Weather API key not configured');
            }
            const cacheKey = `current_${location}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            const url = `${this.baseUrl}/current.json`;
            const params = {
                key: this.apiKey,
                q: location,
                aqi: 'yes'
            };
            logger_1.logger.info(`Fetching current weather for location: ${location}`);
            const response = await axios_1.default.get(url, { params });
            this.setCachedData(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching current weather for ${location}:`, error.message);
            if (error.response?.data?.error) {
                const apiError = error.response.data;
                logger_1.logger.error(`Weather API Error: ${apiError.error.code} - ${apiError.error.message}`);
            }
            return null;
        }
    }
    async getWeatherForecast(location, days = 7) {
        try {
            if (!this.apiKey) {
                throw new Error('Weather API key not configured');
            }
            if (days < 1 || days > 10) {
                throw new Error('Forecast days must be between 1 and 10');
            }
            const cacheKey = `forecast_${location}_${days}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            const url = `${this.baseUrl}/forecast.json`;
            const params = {
                key: this.apiKey,
                q: location,
                days: days,
                aqi: 'yes',
                alerts: 'yes'
            };
            logger_1.logger.info(`Fetching ${days}-day forecast for location: ${location}`);
            const response = await axios_1.default.get(url, { params });
            this.setCachedData(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching forecast for ${location}:`, error.message);
            if (error.response?.data?.error) {
                const apiError = error.response.data;
                logger_1.logger.error(`Weather API Error: ${apiError.error.code} - ${apiError.error.message}`);
            }
            return null;
        }
    }
    async getHistoricalWeather(location, date) {
        try {
            if (!this.apiKey) {
                throw new Error('Weather API key not configured');
            }
            const cacheKey = `historical_${location}_${date}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }
            const url = `${this.baseUrl}/history.json`;
            const params = {
                key: this.apiKey,
                q: location,
                dt: date
            };
            logger_1.logger.info(`Fetching historical weather for ${location} on ${date}`);
            const response = await axios_1.default.get(url, { params });
            this.setCachedData(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching historical weather for ${location}:`, error.message);
            return null;
        }
    }
    async searchLocations(query) {
        try {
            if (!this.apiKey) {
                throw new Error('Weather API key not configured');
            }
            const url = `${this.baseUrl}/search.json`;
            const params = {
                key: this.apiKey,
                q: query
            };
            logger_1.logger.info(`Searching locations for query: ${query}`);
            const response = await axios_1.default.get(url, { params });
            return response.data.map((location) => ({
                id: location.id,
                name: location.name,
                region: location.region,
                country: location.country,
                lat: parseFloat(location.lat),
                lon: parseFloat(location.lon),
                url: location.url
            }));
        }
        catch (error) {
            logger_1.logger.error(`Error searching locations for ${query}:`, error.message);
            return null;
        }
    }
    async getWeatherAlerts(location) {
        try {
            if (!this.apiKey) {
                throw new Error('Weather API key not configured');
            }
            const forecastData = await this.getWeatherForecast(location, 1);
            if (!forecastData?.forecast?.forecastday[0]?.hour) {
                return null;
            }
            const today = forecastData.forecast.forecastday[0];
            const alerts = [];
            if (today.day.totalprecip_mm > 50) {
                alerts.push({
                    type: 'heavy_rain',
                    severity: 'high',
                    message: `Heavy rainfall expected: ${today.day.totalprecip_mm}mm`,
                    period: today.date
                });
            }
            else if (today.day.totalprecip_mm > 20) {
                alerts.push({
                    type: 'moderate_rain',
                    severity: 'medium',
                    message: `Moderate rainfall expected: ${today.day.totalprecip_mm}mm`,
                    period: today.date
                });
            }
            if (today.day.avghumidity > 90) {
                alerts.push({
                    type: 'high_humidity',
                    severity: 'medium',
                    message: `High humidity expected: ${today.day.avghumidity}%`,
                    period: today.date
                });
            }
            return {
                location: forecastData.location,
                alerts: alerts,
                last_updated: forecastData.current.last_updated
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting weather alerts for ${location}:`, error.message);
            return null;
        }
    }
    calculateFloodRisk(weatherData) {
        let riskScore = 0;
        const factors = [];
        if (!weatherData.current && !weatherData.forecast) {
            return {
                risk_level: 'low',
                risk_score: 0,
                factors: ['No weather data available'],
                recommendation: 'Unable to assess flood risk'
            };
        }
        const current = weatherData.current;
        if (current) {
            if (current.precip_mm > 10) {
                riskScore += 30;
                factors.push(`Heavy current rainfall: ${current.precip_mm}mm`);
            }
            else if (current.precip_mm > 5) {
                riskScore += 15;
                factors.push(`Moderate current rainfall: ${current.precip_mm}mm`);
            }
            if (current.humidity > 90) {
                riskScore += 10;
                factors.push(`Very high humidity: ${current.humidity}%`);
            }
            else if (current.humidity > 80) {
                riskScore += 5;
                factors.push(`High humidity: ${current.humidity}%`);
            }
            if (current.wind_kph > 30) {
                riskScore += 5;
                factors.push(`Strong wind: ${current.wind_kph}km/h`);
            }
        }
        if (weatherData.forecast?.forecastday) {
            for (const day of weatherData.forecast.forecastday.slice(0, 3)) {
                if (day.day.totalprecip_mm > 30) {
                    riskScore += 25;
                    factors.push(`Heavy rain forecast (${day.date}): ${day.day.totalprecip_mm}mm`);
                }
                else if (day.day.totalprecip_mm > 15) {
                    riskScore += 10;
                    factors.push(`Moderate rain forecast (${day.date}): ${day.day.totalprecip_mm}mm`);
                }
                if (day.day.daily_chance_of_rain > 80) {
                    riskScore += 15;
                    factors.push(`High chance of rain (${day.date}): ${day.day.daily_chance_of_rain}%`);
                }
                else if (day.day.daily_chance_of_rain > 60) {
                    riskScore += 7;
                    factors.push(`Moderate chance of rain (${day.date}): ${day.day.daily_chance_of_rain}%`);
                }
            }
        }
        let riskLevel;
        let recommendation;
        if (riskScore >= 60) {
            riskLevel = 'very_high';
            recommendation = 'Immediate flood preparedness required. Monitor weather closely and follow evacuation instructions if issued.';
        }
        else if (riskScore >= 30) {
            riskLevel = 'high';
            recommendation = 'High flood risk. Prepare emergency kit, monitor weather updates, and be ready to evacuate if necessary.';
        }
        else if (riskScore >= 15) {
            riskLevel = 'medium';
            recommendation = 'Moderate flood risk. Stay informed about weather conditions and local flood warnings.';
        }
        else {
            riskLevel = 'low';
            recommendation = 'Low flood risk. Continue normal activities but stay aware of weather changes.';
        }
        return {
            risk_level: riskLevel,
            risk_score: Math.min(riskScore, 100),
            factors: factors.length > 0 ? factors : ['No significant risk factors identified'],
            recommendation
        };
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
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
    }
    clearCache() {
        this.cache.clear();
        logger_1.logger.info('Weather API cache cleared');
    }
}
exports.default = new WeatherAPIService();
//# sourceMappingURL=weatherService.js.map