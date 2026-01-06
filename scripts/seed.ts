const mongoose = require('mongoose');
const User = require('../src/models/User');
const Ward = require('../src/models/Ward');
const Weather = require('../src/models/Weather');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flood-risk-db');
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@floodrisk.com',
    password: 'Admin123!',
    role: 'admin',
    fullName: 'Administrator',
    phone: '0123456789',
    address: '123 Admin Street, HCMC'
  },
  {
    username: 'user1',
    email: 'user1@floodrisk.com',
    password: 'User123!',
    role: 'user',
    fullName: 'Nguyễn Văn A',
    phone: '0987654321',
    address: '456 User Street, HCMC'
  },
  {
    username: 'user2',
    email: 'user2@floodrisk.com',
    password: 'User123!',
    role: 'user',
    fullName: 'Trần Thị B',
    phone: '0976543210',
    address: '789 User Avenue, HCMC'
  }
];

const sampleWards = [
  {
    ward_name: 'Phường 1',
    district: 'Quận 1',
    population_density: 25000,
    low_elevation: 1.2,
    drainage_capacity: 15,
    urban_land: 85,
    coordinates: {
      latitude: 10.7745,
      longitude: 106.6987
    },
    area_km2: 0.45,
    description: 'Khu vực trung tâm thành phố'
  },
  {
    ward_name: 'Phường 2',
    district: 'Quận 2',
    population_density: 18000,
    low_elevation: 2.1,
    drainage_capacity: 12,
    urban_land: 75,
    coordinates: {
      latitude: 10.7870,
      longitude: 106.7501
    },
    area_km2: 0.62,
    description: 'Khu vực phát triển mới'
  },
  {
    ward_name: 'Phường 3',
    district: 'Quận 3',
    population_density: 22000,
    low_elevation: 1.8,
    drainage_capacity: 18,
    urban_land: 80,
    coordinates: {
      latitude: 10.7840,
      longitude: 106.6841
    },
    area_km2: 0.48,
    description: 'Khu vực thương mại sầm uất'
  },
  {
    ward_name: 'Phường Tân Định',
    district: 'Quận 1',
    population_density: 28000,
    low_elevation: 1.5,
    drainage_capacity: 10,
    urban_land: 70,
    coordinates: {
      latitude: 10.7900,
      longitude: 106.6900
    },
    area_km2: 0.35,
    description: 'Khu vực đông dân cư'
  },
  {
    ward_name: 'Phường Thảo Điền',
    district: 'Quận 2',
    population_density: 15000,
    low_elevation: 2.8,
    drainage_capacity: 20,
    urban_land: 60,
    coordinates: {
      latitude: 10.8050,
      longitude: 106.7380
    },
    area_km2: 0.75,
    description: 'Khu đô thị mới cao cấp'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Ward.deleteMany({});
    await Weather.deleteMany({});

    // Seed users
    console.log('👥 Seeding users...');
    for (const userData of sampleUsers) {
      await User.create(userData);
    }
    console.log(`✅ Created ${sampleUsers.length} users`);

    // Seed wards
    console.log('🏘️  Seeding wards...');
    await Ward.insertMany(sampleWards);
    console.log(`✅ Created ${sampleWards.length} wards`);

    // Seed weather data (last 30 days for each ward)
    console.log('🌤️  Seeding weather data...');
    const wards = await Ward.find({});
    const weatherData = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      for (const ward of wards) {
        // Generate realistic weather data with some randomness
        const baseTemp = 28 + Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 3; // Seasonal variation
        const temperature = {
          min: Math.round((baseTemp - 3 + Math.random() * 4) * 10) / 10,
          max: Math.round((baseTemp + 3 + Math.random() * 4) * 10) / 10,
          avg: Math.round((baseTemp + Math.random() * 2) * 10) / 10
        };

        const rainfall = Math.random() < 0.3 ? Math.round(Math.random() * 50 * 10) / 10 : 0; // 30% chance of rain
        const humidity = Math.round((70 + Math.random() * 20) * 10) / 10;

        weatherData.push({
          date,
          location: {
            ward_id: ward._id,
            ward_name: ward.ward_name,
            coordinates: ward.coordinates
          },
          temperature,
          humidity,
          rainfall,
          wind_speed: Math.round((5 + Math.random() * 15) * 10) / 10,
          wind_direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
          pressure: Math.round((1005 + Math.random() * 20) * 10) / 10,
          water_level: Math.round((1.5 + Math.random() * 2) * 10) / 10,
          weather_condition: rainfall > 10 ? 'rain' : Math.random() < 0.7 ? 'cloudy' : 'clear'
        });
      }
    }

    await Weather.insertMany(weatherData);
    console.log(`✅ Created ${weatherData.length} weather records`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${sampleUsers.length}`);
    console.log(`   🏘️  Wards: ${sampleWards.length}`);
    console.log(`   🌤️  Weather Records: ${weatherData.length}`);
    console.log('\n🔑 Default Admin Account:');
    console.log('   Username: admin');
    console.log('   Password: Admin123!');
    console.log('   Email: admin@floodrisk.com');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

const runSeeder = async () => {
  await connectDB();
  await seedDatabase();
  process.exit(0);
};

// Run seeder if called directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedDatabase };
