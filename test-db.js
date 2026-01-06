const mongoose = require('mongoose');
require('dotenv').config();

console.log('🧪 Testing MongoDB Connection...\n');

// Kiểm tra environment variables
console.log('📋 Environment Check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('');

const testConnection = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flood-risk-db';

        console.log('🔌 Attempting to connect to:', mongoURI.replace(/\/\/.*@/, '//***:***@'));

        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        const conn = await mongoose.connect(mongoURI, options);

        console.log('✅ Connection successful!');
        console.log('📍 Host:', conn.connection.host);
        console.log('📊 Database:', conn.connection.name);
        console.log('🔗 State:', mongoose.connection.readyState);

        // Test tạo collection
        console.log('\n📝 Testing database operations...');

        // Tạo schema test
        const testSchema = new mongoose.Schema({
            name: String,
            timestamp: { type: Date, default: Date.now }
        });

        // Tạo model (sẽ không tạo collection thực sự cho đến khi insert)
        const TestModel = mongoose.model('TestConnection', testSchema, 'test_connections');

        // Insert document test
        const testDoc = new TestModel({ name: 'Connection Test' });
        await testDoc.save();

        console.log('✅ Database write test successful');

        // Read test
        const docs = await TestModel.find({ name: 'Connection Test' }).limit(1);
        console.log('✅ Database read test successful');

        // Cleanup
        await TestModel.deleteMany({ name: 'Connection Test' });
        console.log('🧹 Cleanup completed');

        console.log('\n🎉 All database tests passed!');

    } catch (error) {
        console.error('\n❌ Database test failed:');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('CodeName:', error.codeName);

        console.log('\n🔍 Troubleshooting:');
        console.log('1. Kiểm tra MongoDB có chạy không: mongod --version');
        console.log('2. Kiểm tra MongoDB service: net start MongoDB (Windows)');
        console.log('3. Kiểm tra port 27017: telnet localhost 27017');
        console.log('4. Hoặc sử dụng MongoDB Atlas cloud');

    } finally {
        // Đóng kết nối
        await mongoose.connection.close();
        console.log('\n🔌 Connection closed');
        process.exit(0);
    }
};

// Chạy test
testConnection();

