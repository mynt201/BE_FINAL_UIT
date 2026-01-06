#!/usr/bin/env node

/**
 * External APIs Test Script
 * Test tất cả external APIs integration
 */

require('dotenv').config();
const weatherService = require('../src/services/external-apis/weatherService').default;
const elevationService = require('../src/services/external-apis/elevationService').default;
const openStreetMapService = require('../src/services/external-apis/openStreetMapService').default;
const vietnamGovService = require('../src/services/external-apis/vietnamGovService').default;
const floodRiskAssessmentService = require('../src/services/external-apis/floodRiskAssessmentService').default;

async function testWeatherAPI() {
  console.log('\n🌤️ Testing Weather API...');

  try {
    // Test current weather
    const weather = await weatherService.getCurrentWeather('Hanoi,Vietnam');
    if (weather) {
      console.log('✅ Current weather: OK');
      console.log(`   Location: ${weather.location.name}`);
      console.log(`   Temperature: ${weather.current.temp_c}°C`);
      console.log(`   Condition: ${weather.current.condition.text}`);
    } else {
      console.log('❌ Current weather: Failed');
    }

    // Test forecast
    const forecast = await weatherService.getWeatherForecast('Hanoi,Vietnam', 3);
    if (forecast) {
      console.log('✅ Weather forecast: OK');
      console.log(`   Forecast days: ${forecast.forecast?.forecastday?.length || 0}`);
    } else {
      console.log('❌ Weather forecast: Failed');
    }

  } catch (error) {
    console.log('❌ Weather API test failed:', error.message);
  }
}

async function testElevationAPI() {
  console.log('\n🏔️ Testing Elevation API...');

  try {
    // Test single point elevation
    const elevation = await elevationService.getElevation(21.0285, 105.8542);
    if (elevation !== null) {
      console.log('✅ Elevation data: OK');
      console.log(`   Elevation: ${elevation}m`);
    } else {
      console.log('❌ Elevation data: Failed');
    }

    // Test flood risk factors
    const riskFactors = await elevationService.getFloodRiskFactors(21.0285, 105.8542);
    if (riskFactors) {
      console.log('✅ Flood risk factors: OK');
      console.log(`   Elevation: ${riskFactors.elevation}m`);
      console.log(`   Proximity to water: ${(riskFactors.proximity_to_water * 100).toFixed(1)}%`);
    } else {
      console.log('❌ Flood risk factors: Failed');
    }

  } catch (error) {
    console.log('❌ Elevation API test failed:', error.message);
  }
}

async function testOpenStreetMapAPI() {
  console.log('\n🗺️ Testing OpenStreetMap API...');

  try {
    // Test location search
    const locations = await openStreetMapService.searchLocations('Hanoi', 3);
    if (locations && locations.length > 0) {
      console.log('✅ Location search: OK');
      console.log(`   Found ${locations.length} locations`);
      console.log(`   First result: ${locations[0].display_name}`);
    } else {
      console.log('❌ Location search: Failed');
    }

    // Test infrastructure data (small bbox around Hanoi center)
    const bbox = [105.8, 21.0, 105.9, 21.05]; // Small area for testing
    const infrastructure = await openStreetMapService.getInfrastructureData(...bbox);
    if (infrastructure) {
      console.log('✅ Infrastructure data: OK');
      console.log(`   Rivers: ${infrastructure.rivers.length}`);
      console.log(`   Roads: ${infrastructure.roads.length}`);
      console.log(`   Buildings: ${infrastructure.buildings.length}`);
    } else {
      console.log('❌ Infrastructure data: Failed');
    }

  } catch (error) {
    console.log('❌ OpenStreetMap API test failed:', error.message);
  }
}

async function testVietnamGovernmentAPI() {
  console.log('\n🇻🇳 Testing Vietnam Government API...');

  try {
    // Test population data
    const populationData = await vietnamGovService.getPopulationData('province', 2023);
    if (populationData && populationData.length > 0) {
      console.log('✅ Population data: OK');
      console.log(`   Provinces: ${populationData.length}`);
      const hanoi = populationData.find(p => p.province_name.includes('Hà Nội'));
      if (hanoi) {
        console.log(`   Hà Nội population: ${hanoi.population.toLocaleString()}`);
      }
    } else {
      console.log('❌ Population data: Failed');
    }

    // Test disaster history
    const disasters = await vietnamGovService.getDisasterHistory('Hanoi', 'flood');
    if (disasters) {
      console.log('✅ Disaster history: OK');
      console.log(`   Flood events: ${disasters.length}`);
    } else {
      console.log('❌ Disaster history: Failed');
    }

  } catch (error) {
    console.log('❌ Vietnam Government API test failed:', error.message);
  }
}

async function testFloodRiskAssessment() {
  console.log('\n🌊 Testing Comprehensive Flood Risk Assessment...');

  try {
    const location = {
      latitude: 21.0285,
      longitude: 105.8542,
      name: 'Hanoi',
      province: 'Hanoi'
    };

    const assessment = await floodRiskAssessmentService.assessFloodRisk(location);
    if (assessment) {
      console.log('✅ Flood risk assessment: OK');
      console.log(`   Overall risk score: ${assessment.overall_risk_score}/100`);
      console.log(`   Risk level: ${assessment.risk_level}`);
      console.log(`   Confidence: ${assessment.confidence_level}`);
      console.log(`   Data sources: ${assessment.data_sources.join(', ')}`);
    } else {
      console.log('❌ Flood risk assessment: Failed');
    }

    // Test flood alerts
    const alerts = await floodRiskAssessmentService.getFloodAlerts('Hanoi');
    if (alerts) {
      console.log('✅ Flood alerts: OK');
      console.log(`   Total alerts: ${alerts.summary.total_alerts}`);
      console.log(`   High severity: ${alerts.summary.high_severity_count}`);
    } else {
      console.log('❌ Flood alerts: Failed');
    }

  } catch (error) {
    console.log('❌ Flood risk assessment test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 External APIs Integration Test Suite');
  console.log('=======================================');

  // Check environment
  console.log('\n🔧 Environment Check:');
  console.log(`   WEATHER_API_KEY: ${process.env.WEATHER_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

  // Run individual tests
  await testWeatherAPI();
  await testElevationAPI();
  await testOpenStreetMapAPI();
  await testVietnamGovernmentAPI();
  await testFloodRiskAssessment();

  console.log('\n🎉 External APIs test completed!');
  console.log('\n📝 Notes:');
  console.log('   - Some APIs may fail if API keys are not configured');
  console.log('   - Network issues may cause temporary failures');
  console.log('   - Mock data is used for Vietnam Government APIs');
  console.log('   - Check EXTERNAL_APIS.md for setup instructions');

  console.log('\n🔗 Useful links:');
  console.log('   - WeatherAPI: https://www.weatherapi.com/');
  console.log('   - Open-Elevation: https://open-elevation.com/');
  console.log('   - OpenStreetMap: https://www.openstreetmap.org/');
  console.log('   - Vietnam Gov Data: https://data.gov.vn/');
}

if (require.main === module) {
  runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
