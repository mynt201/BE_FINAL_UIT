// ======================================
// MongoDB Initialization Script
// ======================================

// Create database and user for the application
db = db.getSiblingDB('flood_risk_db');

// Create application user
db.createUser({
  user: 'flood_user',
  pwd: 'flood_password_2024',
  roles: [
    {
      role: 'readWrite',
      db: 'flood_risk_db'
    }
  ]
});

// Create collections with indexes
db.createCollection('users');
db.createCollection('wards');
db.createCollection('weather');
db.createCollection('riskindices');
db.createCollection('systemusage');
db.createCollection('drainagesystems');
db.createCollection('roadbridges');

// Create indexes for better performance
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.wards.createIndex({ ward_name: 1 }, { unique: true });
db.wards.createIndex({ coordinates: '2dsphere' });

db.weather.createIndex({ 'location.ward_id': 1, date: -1 });
db.weather.createIndex({ rainfall: -1, date: -1 });

db.systemusage.createIndex({ user_id: 1, start_time: -1 });
db.systemusage.createIndex({ ward_id: 1, start_time: -1 });
db.systemusage.createIndex({ action: 1, start_time: -1 });

db.drainagesystems.createIndex({ ward_id: 1, system_type: 1 });
db.drainagesystems.createIndex({ coordinates: '2dsphere' });

db.roadbridges.createIndex({ ward_id: 1, type: 1 });
db.roadbridges.createIndex({ coordinates: '2dsphere' });

db.riskindices.createIndex({ ward_id: 1, calculation_date: -1 });
db.riskindices.createIndex({ risk_level: 1, calculation_date: -1 });

print('Database initialization completed successfully!');
print('Created user: flood_user');
print('Created database: flood_risk_db');
print('Created all collections with indexes');
