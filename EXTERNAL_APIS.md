# 🌐 External APIs Integration Guide

Hướng dẫn tích hợp các API dữ liệu mở bên ngoài cho hệ thống Flood Risk Management.

## 📋 Tổng quan

Hệ thống tích hợp **4 nguồn dữ liệu chính**:

1. **🌤️ Weather API** - Dữ liệu thời tiết real-time và dự báo
2. **🏔️ Elevation API** - Dữ liệu độ cao và địa hình
3. **🗺️ OpenStreetMap** - Dữ liệu bản đồ và hạ tầng
4. **🇻🇳 Vietnam Government APIs** - Dữ liệu chính phủ Việt Nam

## 🔑 API Keys & Setup

### 1. WeatherAPI.com
```bash
# Đăng ký: https://www.weatherapi.com/
# Free tier: 1,000,000 calls/tháng
WEATHER_API_KEY=your_api_key_here
```

### 2. Google Maps API
```bash
# Đăng ký: https://console.cloud.google.com/
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Mapbox
```bash
# Đăng ký: https://account.mapbox.com/
MAPBOX_ACCESS_TOKEN=your_token_here
```

### 4. Open-Elevation API
```bash
# Free, không cần API key
# URL: https://api.open-elevation.com/api/v1/lookup
```

## 🚀 Sử dụng APIs

### Weather Service

```typescript
import weatherService from './services/external-apis/weatherService';

// Lấy thời tiết hiện tại
const weather = await weatherService.getCurrentWeather('Hanoi,Vietnam');

// Lấy dự báo 7 ngày
const forecast = await weatherService.getWeatherForecast('Hanoi,Vietnam', 7);

// Lấy cảnh báo thời tiết
const alerts = await weatherService.getWeatherAlerts('Hanoi');
```

### Elevation Service

```typescript
import elevationService from './services/external-apis/elevationService';

// Lấy độ cao tại tọa độ
const elevation = await elevationService.getElevation(21.0285, 105.8542);

// Phân tích rủi ro địa hình
const riskFactors = await elevationService.getFloodRiskFactors(21.0285, 105.8542);
```

### OpenStreetMap Service

```typescript
import openStreetMapService from './services/external-apis/openStreetMapService';

// Tìm kiếm địa điểm
const locations = await openStreetMapService.searchLocations('Hanoi');

// Lấy dữ liệu hạ tầng
const bbox = [105.8, 21.0, 105.9, 21.1]; // [minLng, minLat, maxLng, maxLat]
const infrastructure = await openStreetMapService.getInfrastructureData(...bbox);
```

### Vietnam Government Service

```typescript
import vietnamGovService from './services/external-apis/vietnamGovService';

// Lấy dữ liệu dân số
const population = await vietnamGovService.getPopulationData('province', 2023);

// Lấy lịch sử thảm họa
const disasters = await vietnamGovService.getDisasterHistory('Hanoi', 'flood');

// Lấy dữ liệu thủy văn
const hydroData = await vietnamGovService.getHydroData('Hanoi');
```

### Comprehensive Flood Risk Assessment

```typescript
import floodRiskAssessmentService from './services/external-apis/floodRiskAssessmentService';

// Đánh giá rủi ro tổng thể
const location = {
  latitude: 21.0285,
  longitude: 105.8542,
  name: 'Hanoi',
  province: 'Hanoi'
};

const assessment = await floodRiskAssessmentService.assessFloodRisk(location);

// Đánh giá hàng loạt
const locations = [location1, location2, location3];
const batchAssessment = await floodRiskAssessmentService.batchAssessFloodRisk(locations);

// Lấy cảnh báo lũ
const alerts = await floodRiskAssessmentService.getFloodAlerts('Hanoi');
```

## 📡 API Endpoints

### Flood Risk Assessment
```http
POST /api/v1/external/flood-risk/assess
Content-Type: application/json

{
  "latitude": 21.0285,
  "longitude": 105.8542,
  "name": "Hanoi",
  "province": "Hanoi"
}
```

```http
GET /api/v1/external/flood-risk/alerts/Hanoi
```

```http
POST /api/v1/external/flood-risk/batch-assess
Content-Type: application/json

{
  "locations": [
    {
      "latitude": 21.0285,
      "longitude": 105.8542,
      "name": "Hanoi"
    }
  ]
}
```

### Weather APIs
```http
GET /api/v1/external/weather/current?location=Hanoi
GET /api/v1/external/weather/forecast?location=Hanoi&days=7
```

### Elevation APIs
```http
GET /api/v1/external/elevation?lat=21.0285&lng=105.8542
GET /api/v1/external/elevation/flood-risk?lat=21.0285&lng=105.8542
```

### OpenStreetMap APIs
```http
GET /api/v1/external/osm/search?query=Hanoi&limit=5
GET /api/v1/external/osm/infrastructure?minLat=21.0&minLng=105.8&maxLat=21.1&maxLng=105.9
```

### Vietnam Government APIs
```http
GET /api/v1/external/vietnam/population?level=province&year=2023
GET /api/v1/external/vietnam/disasters?province=Hanoi&type=flood
GET /api/v1/external/vietnam/hydro?province=Hanoi
```

## 🏗️ Response Format

### Flood Risk Assessment Response
```json
{
  "success": true,
  "data": {
    "location": {
      "latitude": 21.0285,
      "longitude": 105.8542,
      "name": "Hanoi",
      "province": "Hanoi"
    },
    "overall_risk_score": 65,
    "risk_level": "high",
    "assessment_date": "2024-01-15T10:30:00Z",
    "factors": {
      "weather_risk": {
        "score": 70,
        "level": "high",
        "factors": ["Heavy rainfall expected", "High humidity"],
        "current_weather": { ... },
        "forecast": { ... }
      },
      "terrain_risk": {
        "score": 60,
        "level": "medium",
        "elevation": 15.2,
        "slope": 2.1,
        "proximity_to_water": 0.7,
        "factors": ["Low elevation", "Close to water bodies"]
      },
      "infrastructure_risk": {
        "score": 55,
        "level": "medium",
        "factors": ["Limited drainage infrastructure"],
        "infrastructure_count": {
          "rivers": 3,
          "water_bodies": 8,
          "drainage": 2,
          "roads": 25,
          "buildings": 45
        }
      },
      "historical_risk": {
        "score": 75,
        "level": "high",
        "historical_events": 12,
        "average_impact": 25000000,
        "trend": "increasing",
        "factors": ["12 historical flood events", "Increasing trend"]
      },
      "population_risk": {
        "score": 50,
        "level": "medium",
        "population_density": 2400,
        "urban_percentage": 85,
        "factors": ["High population density", "Highly urbanized"]
      }
    },
    "recommendations": {
      "immediate_actions": [
        "Monitor water levels continuously",
        "Prepare emergency supplies"
      ],
      "short_term": [
        "Monitor weather forecasts closely",
        "Clear drains and stormwater systems"
      ],
      "long_term": [
        "Improve drainage infrastructure",
        "Implement flood-resistant building codes"
      ],
      "preparedness": [
        "Create family emergency plan",
        "Prepare sandbags and flood barriers"
      ]
    },
    "data_sources": ["WeatherAPI", "Open-Elevation API", "OpenStreetMap", "Vietnam Government Data"],
    "confidence_level": "high"
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
WEATHER_API_KEY=your_weatherapi_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Optional - Vietnam Government APIs
VIETNAM_GOV_API_KEY=your_gov_api_key
VIETNAM_GOV_BASE_URL=https://api.thongke.gov.vn
```

### Rate Limiting
- **Weather API**: 50 requests/15 phút per user
- **Elevation API**: No rate limit (but be respectful)
- **OpenStreetMap**: No rate limit (but cache results)
- **Vietnam Gov APIs**: Rate limits vary by provider

### Caching Strategy
- **Weather data**: 10 phút cache
- **Elevation data**: 24 giờ cache
- **OSM data**: 1 giờ cache
- **Government data**: 24 giờ cache

## 🚨 Error Handling

### Common Error Responses
```json
{
  "success": false,
  "message": "Weather data not available for this location"
}

{
  "success": false,
  "message": "API rate limit exceeded",
  "retryAfter": 900
}

{
  "success": false,
  "message": "External API temporarily unavailable"
}
```

### Fallback Strategies
1. **Weather API fails**: Use cached data if available
2. **Elevation API fails**: Skip terrain analysis, continue with other factors
3. **OSM API fails**: Use default infrastructure assumptions
4. **Government API fails**: Use historical averages

## 📊 Data Sources & Accuracy

### WeatherAPI.com
- **Accuracy**: High (professional meteorological data)
- **Coverage**: Global
- **Update frequency**: Real-time + hourly forecasts
- **Limitations**: API key required, rate limits

### Open-Elevation
- **Accuracy**: Medium-High (ASTER GDEM data)
- **Coverage**: Global
- **Update frequency**: Static (terrain doesn't change)
- **Limitations**: No API key, occasional outages

### OpenStreetMap
- **Accuracy**: Varies by region (Vietnam data is good)
- **Coverage**: Global
- **Update frequency**: Community-driven updates
- **Limitations**: Data quality depends on contributors

### Vietnam Government APIs
- **Accuracy**: High (official government data)
- **Coverage**: Vietnam only
- **Update frequency**: Regular updates
- **Limitations**: May require API keys, limited public access

## 🔄 Updating API Keys

```bash
# Stop server
npm stop

# Update .env file
nano .env

# Clear caches (optional)
# This will force fresh API calls
rm -rf .cache/

# Restart server
npm start
```

## 📈 Monitoring & Analytics

### API Usage Tracking
- All external API calls are logged
- Rate limiting is enforced
- Cache hit/miss ratios tracked
- Error rates monitored

### Performance Metrics
```typescript
// Check API response times
const startTime = Date.now();
const result = await weatherService.getCurrentWeather(location);
const responseTime = Date.now() - startTime;
logger.info(`Weather API response time: ${responseTime}ms`);
```

## 🔐 Security Considerations

### API Key Protection
- Never commit API keys to git
- Use environment variables
- Rotate keys regularly
- Monitor API usage for abuse

### Data Validation
- Validate all external data
- Implement timeout limits
- Handle malformed responses gracefully
- Log suspicious activities

## 🚀 Production Deployment

### Environment Setup
```bash
# Production .env
NODE_ENV=production
WEATHER_API_KEY=prod_weather_key
GOOGLE_MAPS_API_KEY=prod_maps_key
REDIS_URL=redis://prod-redis-server:6379
```

### Scaling Considerations
- Implement Redis caching for high traffic
- Use load balancing for multiple instances
- Monitor API rate limits across instances
- Consider API gateway for external APIs

### Backup & Recovery
- Cache critical data locally
- Implement fallback data sources
- Monitor external API health
- Have backup API providers ready

---

## 📚 Additional Resources

- [WeatherAPI Documentation](https://www.weatherapi.com/docs/)
- [Open-Elevation API](https://open-elevation.com/)
- [OpenStreetMap API](https://wiki.openstreetmap.org/wiki/API)
- [Vietnam Government Open Data](https://data.gov.vn/)

**🎯 External APIs giúp hệ thống Flood Risk Management có dữ liệu real-time và chính xác để đưa ra đánh giá rủi ro lũ lụt tốt nhất!** 🌊📊
