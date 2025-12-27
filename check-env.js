#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * Kiểm tra cấu hình .env cho Flood Risk Management Backend
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');

console.log('🔧 Checking Environment Configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const hasEnvFile = fs.existsSync(envPath);

console.log(`📄 .env file: ${hasEnvFile ? '✅ Found' : '❌ Missing'}`);
if (!hasEnvFile) {
    console.log('   → Create .env file from ENV_CONFIG.md\n');
}

// Required environment variables
const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'NODE_ENV',
    'PORT'
];

// Recommended variables
const recommendedVars = [
    'CORS_ORIGIN',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
    'MAX_FILE_SIZE',
    'LOG_LEVEL'
];

let missingRequired = [];
let missingRecommended = [];

// Check required variables
console.log('🔑 Required Variables:');
requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
        console.log(`   ❌ ${varName}: Missing`);
        missingRequired.push(varName);
    } else {
        console.log(`   ✅ ${varName}: Set`);
    }
});

console.log('\n📋 Recommended Variables:');
recommendedVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
        console.log(`   ⚠️  ${varName}: Not set (using defaults)`);
        missingRecommended.push(varName);
    } else {
        console.log(`   ✅ ${varName}: Set`);
    }
});

// Security checks
console.log('\n🔒 Security Checks:');

// JWT Secret strength
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
    if (jwtSecret.length < 32) {
        console.log('   ⚠️  JWT_SECRET: Too short (should be > 32 characters)');
    } else if (jwtSecret.includes('change_in_production')) {
        console.log('   ⚠️  JWT_SECRET: Using default value - change for production!');
    } else {
        console.log('   ✅ JWT_SECRET: Good strength');
    }
}

// Environment check
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv === 'production') {
    console.log('   ✅ NODE_ENV: Production mode');
} else if (nodeEnv === 'development') {
    console.log('   ✅ NODE_ENV: Development mode');
} else {
    console.log('   ⚠️  NODE_ENV: Not set or invalid (defaulting to development)');
}

// MongoDB URI check
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
    if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
        console.log('   ℹ️  MONGODB_URI: Using local MongoDB');
    } else if (mongoUri.includes('mongodb+srv')) {
        console.log('   ℹ️  MONGODB_URI: Using MongoDB Atlas');
    } else {
        console.log('   ℹ️  MONGODB_URI: Using custom MongoDB connection');
    }
}

// Port check
const port = process.env.PORT;
if (port) {
    const portNum = parseInt(port);
    if (portNum < 1000 || portNum > 65535) {
        console.log('   ⚠️  PORT: Unusual port number');
    } else {
        console.log(`   ℹ️  PORT: ${port}`);
    }
}

// CORS check
const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
    if (corsOrigin.includes('localhost')) {
        console.log('   ℹ️  CORS_ORIGIN: Development origins configured');
    } else {
        console.log('   ℹ️  CORS_ORIGIN: Production origins configured');
    }
}

// Summary
console.log('\n📊 Summary:');

if (missingRequired.length === 0) {
    console.log('✅ All required variables are set');
} else {
    console.log(`❌ Missing ${missingRequired.length} required variables:`);
    missingRequired.forEach(v => console.log(`   - ${v}`));
}

if (missingRecommended.length > 0) {
    console.log(`ℹ️  ${missingRecommended.length} recommended variables not set (using defaults)`);
}

console.log('\n🚀 Next Steps:');
if (missingRequired.length > 0) {
    console.log('1. Add missing required variables to .env file');
    console.log('2. Refer to ENV_CONFIG.md for guidance');
} else {
    console.log('1. Start MongoDB server: mongod');
    console.log('2. Run database seeding: npm run seed');
    console.log('3. Start development server: npm run dev');
}

console.log('\n📚 Documentation: See ENV_CONFIG.md for detailed configuration guide');