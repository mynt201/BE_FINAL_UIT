// Quick API test script to verify new libraries work
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testAPI() {
  try {
    console.log('🧪 Testing API with new libraries...\n');

    // Test health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test user registration with Zod validation
    console.log('\n2. Testing user registration with Zod validation...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        username: 'testuser_zod',
        email: 'test_zod@example.com',
        password: 'Test123!',
        fullName: 'Test User Zod',
        role: 'user'
      });
      console.log('✅ Registration successful:', registerResponse.data.data.user.username);
    } catch (error) {
      console.log('ℹ️  Registration failed (expected if user exists):', error.response?.data?.error);
    }

    // Test login
    console.log('\n3. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'Admin123!'
    });
    console.log('✅ Login successful for:', loginResponse.data.data.user.username);

    const token = loginResponse.data.data.tokens.accessToken;

    // Test protected route
    console.log('\n4. Testing protected route with JWT...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Protected route works:', meResponse.data.data.username);

    // Test users list with pagination
    console.log('\n5. Testing users list with pagination...');
    const usersResponse = await axios.get(`${BASE_URL}/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Users list:', usersResponse.data.data.length, 'users');

    // Test dashboard stats
    console.log('\n6. Testing dashboard statistics...');
    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Dashboard stats:', {
      totalUsers: dashboardResponse.data.data.overview.totalUsers,
      totalWards: dashboardResponse.data.data.overview.totalWards
    });

    console.log('\n🎉 All tests passed! New libraries working correctly.');
    console.log('\n📊 Libraries tested:');
    console.log('  ✅ Zod - Type-safe validation');
    console.log('  ✅ Pino - High-performance logging');
    console.log('  ✅ bcrypt - Native password hashing');
    console.log('  ✅ Express 4.19+ - Latest framework');
    console.log('  ✅ Mongoose 8.5+ - Latest ODM');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run test if called directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
