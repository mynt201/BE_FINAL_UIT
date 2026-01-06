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

class WeatherAPIService {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_DURATION: number = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '';
    this.baseUrl = 'https://api.weatherapi.com/v1';
    this.cache = new Map();
  }

  async getCurrentWeather(location: string): Promise<WeatherData | null> {
    try {
      const url = `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodeURIComponent(
        location
      )}&aqi=no`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = (await response.json()) as WeatherData;
      return data;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      return null;
    }
  }

  async getWeatherForecast(location: string, days: number = 7): Promise<WeatherData | null> {
    try {
      const url = `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${encodeURIComponent(
        location
      )}&days=${days}&aqi=no&alerts=no`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = (await response.json()) as WeatherData;
      return data;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      return null;
    }
  }

  async getHistoricalWeather(location: string, date: string): Promise<WeatherData | null> {
    try {
      const url = `${this.baseUrl}/history.json?key=${this.apiKey}&q=${encodeURIComponent(
        location
      )}&dt=${date}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = (await response.json()) as WeatherData;
      return data;
    } catch (error) {
      console.error('Error fetching historical weather:', error);
      return null;
    }
  }

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
      const url = `${this.baseUrl}/search.json?key=${this.apiKey}&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = (await response.json()) as Array<{
        id: number;
        name: string;
        region: string;
        country: string;
        lat: number;
        lon: number;
        url: string;
      }>;
      return data;
    } catch (error) {
      console.error('Error searching locations:', error);
      return null;
    }
  }

  async getWeatherAlerts(location: string): Promise<any> {
    // Stub implementation
    return null;
  }

  async getHydroData(location: string): Promise<any> {
    // Stub implementation for hydrological data
    return null;
  }

  calculateFloodRisk(weatherData: WeatherData): {
    risk_level: 'low' | 'medium' | 'high' | 'very_high';
    risk_score: number;
    factors: string[];
    recommendation: string;
  } {
    // Simple flood risk calculation based on rainfall and humidity
    const rainfall = weatherData.current.precip_mm;
    const humidity = weatherData.current.humidity;

    let risk_score = 0;
    const factors: string[] = [];

    if (rainfall > 50) {
      risk_score += 3;
      factors.push('Heavy rainfall');
    } else if (rainfall > 25) {
      risk_score += 2;
      factors.push('Moderate rainfall');
    } else if (rainfall > 10) {
      risk_score += 1;
      factors.push('Light rainfall');
    }

    if (humidity > 90) {
      risk_score += 2;
      factors.push('Very high humidity');
    } else if (humidity > 80) {
      risk_score += 1;
      factors.push('High humidity');
    }

    let risk_level: 'low' | 'medium' | 'high' | 'very_high';
    let recommendation: string;

    if (risk_score >= 4) {
      risk_level = 'very_high';
      recommendation =
        'High flood risk. Take immediate precautions and monitor water levels closely.';
    } else if (risk_score >= 3) {
      risk_level = 'high';
      recommendation = 'Elevated flood risk. Prepare emergency supplies and stay alert.';
    } else if (risk_score >= 2) {
      risk_level = 'medium';
      recommendation = 'Moderate flood risk. Keep updated with weather reports.';
    } else {
      risk_level = 'low';
      recommendation = 'Low flood risk. Normal activities can continue.';
    }

    return {
      risk_level,
      risk_score,
      factors,
      recommendation,
    };
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default WeatherAPIService;
