// Simple database connection and seeding test
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flood-risk-db';

async function testDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Get database info
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('📊 Database Info:');
    console.log(`   Database: ${db.databaseName}`);
    console.log(`   Collections: ${collections.length}`);
    console.log('   Collections:', collections.map(c => c.name).join(', ') || 'None');

    // Count documents in each collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

// Run seeding if requested
async function runSeeding() {
  try {
    console.log('🌱 Running database seeding...');

    // Simple seeding - just create admin user
    const User = require('./src/models/User.ts'); // This won't work, but shows concept

    console.log('⚠️  Note: Seeding requires TypeScript models to be compiled first');
    console.log('   Run: npm run build');
    console.log('   Then: npm run seed');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
}

// Main execution
const command = process.argv[2];

if (command === 'seed') {
  runSeeding();
} else {
  testDatabase();
}
