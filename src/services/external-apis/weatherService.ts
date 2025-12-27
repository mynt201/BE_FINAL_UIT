import axios, { AxiosResponse } from 'axios';
import { logger } from '../../utils/logger';

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        maxwind_mph: number;
        maxwind_kph: number;
        totalprecip_mm: number;
        totalprecip_in: number;
        totalsnow_cm: number;
        avgvis_km: number;
        avgvis_miles: number;
        avghumidity: number;
        daily_will_it_rain: number;
        daily_chance_of_rain: number;
        daily_will_it_snow: number;
        daily_chance_of_snow: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        uv: number;
      };
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: string;
        is_moon_up: number;
        is_sun_up: number;
      };
      hour: Array<{
        time_epoch: number;
        time: string;
        temp_c: number;
        temp_f: number;
        is_day: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        wind_mph: number;
        wind_kph: number;
        wind_degree: number;
        wind_dir: string;
        pressure_mb: number;
        pressure_in: number;
        precip_mm: number;
        precip_in: number;
        humidity: number;
        cloud: number;
        feelslike_c: number;
        feelslike_f: number;
        windchill_c: number;
        windchill_f: number;
        heatindex_c: number;
        heatindex_f: number;
        dewpoint_c: number;
        dewpoint_f: number;
        will_it_rain: number;
        chance_of_rain: number;
        will_it_snow: number;
        chance_of_snow: number;
        vis_km: number;
        vis_miles: number;
        gust_mph: number;
        gust_kph: number;
        uv: number;
      }>;
    }>;
  };
}

interface WeatherAPIError {
  error: {
    code: number;
    message: string;
  };
}

class WeatherAPIService {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '';
    this.baseUrl = 'http://api.weatherapi.com/v1';

    if (!this.apiKey) {
      logger.warn('Weather API key not configured. Weather services will not work.');
    }
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(location: string): Promise<WeatherData | null> {
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

      logger.info(`Fetching current weather for location: ${location}`);
      const response: AxiosResponse<WeatherData> = await axios.get(url, { params });

      this.setCachedData(cacheKey, response.data);
      return response.data;

    } catch (error: any) {
      logger.error(`Error fetching current weather for ${location}:`, error.message);

      if (error.response?.data?.error) {
        const apiError = error.response.data as WeatherAPIError;
        logger.error(`Weather API Error: ${apiError.error.code} - ${apiError.error.message}`);
      }

      return null;
    }
  }

  /**
   * Get weather forecast for a location
   */
  async getWeatherForecast(location: string, days: number = 7): Promise<WeatherData | null> {
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

      logger.info(`Fetching ${days}-day forecast for location: ${location}`);
      const response: AxiosResponse<WeatherData> = await axios.get(url, { params });

      this.setCachedData(cacheKey, response.data);
      return response.data;

    } catch (error: any) {
      logger.error(`Error fetching forecast for ${location}:`, error.message);

      if (error.response?.data?.error) {
        const apiError = error.response.data as WeatherAPIError;
        logger.error(`Weather API Error: ${apiError.error.code} - ${apiError.error.message}`);
      }

      return null;
    }
  }

  /**
   * Get historical weather data
   */
  async getHistoricalWeather(location: string, date: string): Promise<WeatherData | null> {
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

      logger.info(`Fetching historical weather for ${location} on ${date}`);
      const response: AxiosResponse<WeatherData> = await axios.get(url, { params });

      this.setCachedData(cacheKey, response.data);
      return response.data;

    } catch (error: any) {
      logger.error(`Error fetching historical weather for ${location}:`, error.message);
      return null;
    }
  }

  /**
   * Search for locations
   */
  async searchLocations(query: string): Promise<Array<{
    id: number;
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    url: string;
  }> | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Weather API key not configured');
      }

      const url = `${this.baseUrl}/search.json`;
      const params = {
        key: this.apiKey,
        q: query
      };

      logger.info(`Searching locations for query: ${query}`);
      const response: AxiosResponse<any[]> = await axios.get(url, { params });

      return response.data.map((location: any) => ({
        id: location.id,
        name: location.name,
        region: location.region,
        country: location.country,
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
        url: location.url
      }));

    } catch (error: any) {
      logger.error(`Error searching locations for ${query}:`, error.message);
      return null;
    }
  }

  /**
   * Get weather alerts for a location
   */
  async getWeatherAlerts(location: string): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Weather API key not configured');
      }

      const forecastData = await this.getWeatherForecast(location, 1);
      if (!forecastData?.forecast?.forecastday[0]?.hour) {
        return null;
      }

      // Analyze weather data for flood risk alerts
      const today = forecastData.forecast.forecastday[0];
      const alerts: any[] = [];

      // Heavy rain alert
      if (today.day.totalprecip_mm > 50) {
        alerts.push({
          type: 'heavy_rain',
          severity: 'high',
          message: `Heavy rainfall expected: ${today.day.totalprecip_mm}mm`,
          period: today.date
        });
      } else if (today.day.totalprecip_mm > 20) {
        alerts.push({
          type: 'moderate_rain',
          severity: 'medium',
          message: `Moderate rainfall expected: ${today.day.totalprecip_mm}mm`,
          period: today.date
        });
      }

      // High humidity alert
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

    } catch (error: any) {
      logger.error(`Error getting weather alerts for ${location}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate flood risk based on weather data
   */
  calculateFloodRisk(weatherData: WeatherData): {
    risk_level: 'low' | 'medium' | 'high' | 'very_high';
    risk_score: number;
    factors: string[];
    recommendation: string;
  } {
    let riskScore = 0;
    const factors: string[] = [];

    if (!weatherData.current && !weatherData.forecast) {
      return {
        risk_level: 'low',
        risk_score: 0,
        factors: ['No weather data available'],
        recommendation: 'Unable to assess flood risk'
      };
    }

    // Current conditions
    const current = weatherData.current;
    if (current) {
      // Heavy rain increases risk
      if (current.precip_mm > 10) {
        riskScore += 30;
        factors.push(`Heavy current rainfall: ${current.precip_mm}mm`);
      } else if (current.precip_mm > 5) {
        riskScore += 15;
        factors.push(`Moderate current rainfall: ${current.precip_mm}mm`);
      }

      // High humidity contributes to risk
      if (current.humidity > 90) {
        riskScore += 10;
        factors.push(`Very high humidity: ${current.humidity}%`);
      } else if (current.humidity > 80) {
        riskScore += 5;
        factors.push(`High humidity: ${current.humidity}%`);
      }

      // Wind can affect water levels
      if (current.wind_kph > 30) {
        riskScore += 5;
        factors.push(`Strong wind: ${current.wind_kph}km/h`);
      }
    }

    // Forecast conditions
    if (weatherData.forecast?.forecastday) {
      for (const day of weatherData.forecast.forecastday.slice(0, 3)) { // Next 3 days
        // Heavy forecasted rain
        if (day.day.totalprecip_mm > 30) {
          riskScore += 25;
          factors.push(`Heavy rain forecast (${day.date}): ${day.day.totalprecip_mm}mm`);
        } else if (day.day.totalprecip_mm > 15) {
          riskScore += 10;
          factors.push(`Moderate rain forecast (${day.date}): ${day.day.totalprecip_mm}mm`);
        }

        // High chance of rain
        if (day.day.daily_chance_of_rain > 80) {
          riskScore += 15;
          factors.push(`High chance of rain (${day.date}): ${day.day.daily_chance_of_rain}%`);
        } else if (day.day.daily_chance_of_rain > 60) {
          riskScore += 7;
          factors.push(`Moderate chance of rain (${day.date}): ${day.day.daily_chance_of_rain}%`);
        }
      }
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'very_high';
    let recommendation: string;

    if (riskScore >= 60) {
      riskLevel = 'very_high';
      recommendation = 'Immediate flood preparedness required. Monitor weather closely and follow evacuation instructions if issued.';
    } else if (riskScore >= 30) {
      riskLevel = 'high';
      recommendation = 'High flood risk. Prepare emergency kit, monitor weather updates, and be ready to evacuate if necessary.';
    } else if (riskScore >= 15) {
      riskLevel = 'medium';
      recommendation = 'Moderate flood risk. Stay informed about weather conditions and local flood warnings.';
    } else {
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

  private getCachedData(key: string): WeatherData | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: WeatherData): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Clean up old cache entries (keep cache size manageable)
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Weather API cache cleared');
  }
}

export default new WeatherAPIService();
