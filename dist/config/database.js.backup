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
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        };
        const conn = await mongoose_1.default.connect(mongoURI, options);
        logger_1.default.info(`MongoDB Connected: ${conn.connection.host}`);
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.default.info('MongoDB reconnected');
        });
    }
    catch (error) {
        logger_1.default.error('Database connection error:', error.message);
        process.exit(1);
    }
};
module.exports = connectDB;
//# sourceMappingURL=database.js.map