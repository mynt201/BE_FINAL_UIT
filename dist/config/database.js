"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const connectDB = async () => {
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
        logger_1.default.info(`Attempting to connect to MongoDB: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`);
        const conn = await mongoose_1.default.connect(mongoURI, options);
        logger_1.default.info(`✅ MongoDB Connected successfully to: ${conn.connection.host}`);
        logger_1.default.info(`📊 Database: ${conn.connection.name}`);
        logger_1.default.info(`🔗 Connection state: ${mongoose_1.default.connection.readyState}`);
        // Event listeners
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('❌ MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('⚠️  MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.default.info('🔄 MongoDB reconnected');
        });
        mongoose_1.default.connection.on('connecting', () => {
            logger_1.default.info('🔌 Connecting to MongoDB...');
        });
        mongoose_1.default.connection.on('connected', () => {
            logger_1.default.info('✅ MongoDB connected');
        });
        mongoose_1.default.connection.on('disconnecting', () => {
            logger_1.default.warn('🔌 Disconnecting from MongoDB...');
        });
    }
    catch (error) {
        logger_1.default.error('❌ Database connection failed:', {
            error: error.message,
            code: error.code,
            codeName: error.codeName,
            uri: process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@')
        });
        // Trong development, không exit để server vẫn chạy
        if (process.env.NODE_ENV === 'production') {
            logger_1.default.error('💥 Exiting due to database connection failure in production');
            process.exit(1);
        }
        else {
            logger_1.default.warn('⚠️  Server will continue without database connection (development mode)');
        }
    }
};
module.exports = connectDB;
//# sourceMappingURL=database.js.map