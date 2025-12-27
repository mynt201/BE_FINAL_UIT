// Simple test server to verify backend works
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Flood Risk Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic auth endpoint
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint working',
    data: {
      user: { username: 'test', role: 'user' },
      tokens: {
        accessToken: 'test-token',
        refreshToken: 'test-refresh-token'
      }
    }
  });
});

// Basic external API endpoint
app.post('/api/external/flood-risk/assess', (req, res) => {
  res.json({
    success: true,
    message: 'Flood risk assessment endpoint working',
    data: {
      overall_risk_score: 45,
      risk_level: 'medium',
      assessment_date: new Date().toISOString(),
      factors: {
        weather_risk: { score: 40, level: 'medium' },
        terrain_risk: { score: 50, level: 'medium' },
        infrastructure_risk: { score: 35, level: 'low' },
        historical_risk: { score: 55, level: 'high' },
        population_risk: { score: 40, level: 'medium' }
      },
      recommendations: {
        immediate_actions: ['Monitor local weather conditions'],
        short_term: ['Prepare emergency supplies'],
        long_term: ['Consider flood insurance'],
        preparedness: ['Create family emergency plan']
      },
      data_sources: ['Test Data'],
      confidence_level: 'high'
    }
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB if URI is provided
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.log('⚠️  MongoDB connection failed:', err.message));
}

app.listen(PORT, () => {
  console.log(`🚀 Flood Risk Backend Test Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth test: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`🌊 Flood risk test: POST http://localhost:${PORT}/api/external/flood-risk/assess`);
});
