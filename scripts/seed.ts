import mongoose from 'mongoose';
import User from '../src/models/User';
import Ward from '../src/models/Ward';
import Weather from '../src/models/Weather';
import SystemUsage from '../src/models/SystemUsage';
import DrainageSystem from '../src/models/DrainageSystem';
import RoadBridge from '../src/models/RoadBridge';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
    await SystemUsage.deleteMany({});
    await DrainageSystem.deleteMany({});
    await RoadBridge.deleteMany({});

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

    // Seed system usage data
    console.log('📊 Seeding system usage data...');
    const systemUsageData = [];
    const users = await User.find({});
    const actions = [
      'login', 'view_map', 'view_risk_report', 'export_data',
      'view_statistics', 'view_dashboard', 'update_settings'
    ];

    for (let i = 0; i < 100; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]!;
      const randomWard = wards[Math.floor(Math.random() * wards.length)]!;
      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      const startTime = new Date();
      startTime.setDate(startTime.getDate() - Math.floor(Math.random() * 30));

      systemUsageData.push({
        user_id: randomUser._id.toString(),
        ward_id: randomWard._id.toString(),
        action: randomAction,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        session_id: `session_${Math.random().toString(36).substring(2, 15)}`,
        start_time: startTime,
        end_time: new Date(startTime.getTime() + Math.floor(Math.random() * 3600000)), // Up to 1 hour
        status: Math.random() > 0.9 ? 'error' : 'success',
        device_info: {
          browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
          os: ['Windows', 'macOS', 'Linux', 'Android', 'iOS'][Math.floor(Math.random() * 5)],
        }
      });
    }

    await SystemUsage.insertMany(systemUsageData);
    console.log(`✅ Created ${systemUsageData.length} system usage records`);

    // Seed drainage systems
    console.log('🚰 Seeding drainage systems...');
    const drainageSystemsData = [];

    for (const ward of wards) {
      // Create 1-3 drainage systems per ward
      const numSystems = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numSystems; i++) {
        const systemTypes = ['surface_drainage', 'underground_drainage', 'combined_system', 'stormwater_management'];
        const conditions = ['excellent', 'good', 'fair', 'poor'];

        const installationYear = 2000 + Math.floor(Math.random() * 23); // 2000-2023

        drainageSystemsData.push({
          ward_id: ward._id.toString(),
          ward_name: ward.ward_name,
          system_name: `${ward.ward_name} Drainage System ${i + 1}`,
          system_type: systemTypes[Math.floor(Math.random() * systemTypes.length)],
          location: `${ward.ward_name}, ${ward.district}`,
          coordinates: {
            latitude: ward.coordinates.latitude + (Math.random() - 0.5) * 0.01,
            longitude: ward.coordinates.longitude + (Math.random() - 0.5) * 0.01,
          },
          design_capacity: 50 + Math.floor(Math.random() * 200), // 50-250 m³/h
          current_flow_rate: 10 + Math.floor(Math.random() * 100), // 10-110 m³/h
          material: ['concrete', 'plastic', 'metal'][Math.floor(Math.random() * 3)],
          installation_year: installationYear,
          last_maintenance: new Date(installationYear + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          condition: conditions[Math.floor(Math.random() * conditions.length)],
          efficiency_rating: 60 + Math.floor(Math.random() * 35), // 60-95%
          coverage_area: 0.5 + Math.random() * 2, // 0.5-2.5 km²
        });
      }
    }

    await DrainageSystem.insertMany(drainageSystemsData);
    console.log(`✅ Created ${drainageSystemsData.length} drainage systems`);

    // Seed road/bridge infrastructure
    console.log('🌉 Seeding road and bridge infrastructure...');
    const roadBridgeData = [];

    for (const ward of wards) {
      // Create 2-5 infrastructure items per ward
      const numItems = Math.floor(Math.random() * 4) + 2;

      for (let i = 0; i < numItems; i++) {
        const types = ['road', 'bridge', 'culvert', 'footbridge'];
        const categories = ['national', 'provincial', 'district', 'local'];
        const statuses = ['operational', 'under_maintenance', 'operational', 'operational']; // Mostly operational
        const conditions = ['excellent', 'good', 'fair'];

        roadBridgeData.push({
          ward_id: ward._id.toString(),
          ward_name: ward.ward_name,
          name: `${ward.ward_name} ${types[Math.floor(Math.random() * types.length)]} ${i + 1}`,
          type: types[Math.floor(Math.random() * types.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          location: `${ward.ward_name}, ${ward.district}`,
          coordinates: {
            start: {
              latitude: ward.coordinates.latitude + (Math.random() - 0.5) * 0.02,
              longitude: ward.coordinates.longitude + (Math.random() - 0.5) * 0.02,
            },
            end: {
              latitude: ward.coordinates.latitude + (Math.random() - 0.5) * 0.02,
              longitude: ward.coordinates.longitude + (Math.random() - 0.5) * 0.02,
            }
          },
          specifications: {
            length: 50 + Math.floor(Math.random() * 500), // 50-550m
            width: 3 + Math.floor(Math.random() * 15), // 3-18m
            lanes: 1 + Math.floor(Math.random() * 4), // 1-4 lanes
            max_load: 10 + Math.floor(Math.random() * 40), // 10-50 tons
            speed_limit: 30 + Math.floor(Math.random() * 50), // 30-80 km/h
            surface_type: ['asphalt', 'concrete'][Math.floor(Math.random() * 2)]
          },
          construction: {
            construction_year: 1990 + Math.floor(Math.random() * 33), // 1990-2023
            cost: 1000000 + Math.floor(Math.random() * 50000000), // 1M - 51M VND
          },
          maintenance: {
            condition_rating: 3 + Math.floor(Math.random() * 7), // 3-10 rating
          },
          traffic: {
            daily_volume: 1000 + Math.floor(Math.random() * 20000), // 1k-21k vehicles/day
            congestion_level: ['low', 'moderate', 'low', 'low'][Math.floor(Math.random() * 4)]
          },
          flood_vulnerability: {
            flood_risk_level: ['low', 'medium', 'high', 'low', 'low'][Math.floor(Math.random() * 5)]
          }
        });
      }
    }

    await RoadBridge.insertMany(roadBridgeData);
    console.log(`✅ Created ${roadBridgeData.length} road/bridge infrastructure items`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${sampleUsers.length}`);
    console.log(`   🏘️  Wards: ${sampleWards.length}`);
    console.log(`   🌤️  Weather Records: ${weatherData.length}`);
    console.log(`   📊 System Usage Records: ${systemUsageData.length}`);
    console.log(`   🚰 Drainage Systems: ${drainageSystemsData.length}`);
    console.log(`   🌉 Road/Bridge Infrastructure: ${roadBridgeData.length}`);
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

export { seedDatabase };
