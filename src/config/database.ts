import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flood-risk-db';

        // Kiểm tra URI
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            bufferCommands: false,
            bufferMaxEntries: 0
        };

        logger.info(`Attempting to connect to MongoDB: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`);

        const conn = await mongoose.connect(mongoURI, options);

        logger.info(`✅ MongoDB Connected successfully to: ${conn.connection.host}`);
        logger.info(`📊 Database: ${conn.connection.name}`);
        logger.info(`🔗 Connection state: ${mongoose.connection.readyState}`);

        // Event listeners
        mongoose.connection.on('error', (err) => {
            logger.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️  MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('🔄 MongoDB reconnected');
        });

        mongoose.connection.on('connecting', () => {
            logger.info('🔌 Connecting to MongoDB...');
        });

        mongoose.connection.on('connected', () => {
            logger.info('✅ MongoDB connected');
        });

        mongoose.connection.on('disconnecting', () => {
            logger.warn('🔌 Disconnecting from MongoDB...');
        });

    } catch (error: any) {
        logger.error('❌ Database connection failed:', {
            error: error.message,
            code: error.code,
            codeName: error.codeName,
            uri: process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@')
        });

        // Trong development, không exit để server vẫn chạy
        if (process.env.NODE_ENV === 'production') {
            logger.error('💥 Exiting due to database connection failure in production');
            process.exit(1);
        } else {
            logger.warn('⚠️  Server will continue without database connection (development mode)');
        }
    }
};

module.exports = connectDB;
