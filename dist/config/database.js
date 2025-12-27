"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const logger_1 = require("../utils/logger");
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flood-risk-db';
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        };
        const conn = await mongoose_1.default.connect(mongoURI, options);
        logger_1.logger.info(`MongoDB Connected: ${conn.connection.host}`);
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.logger.info('MongoDB reconnected');
        });
    }
    catch (error) {
        logger_1.logger.error('Database connection error:', error.message);
        process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=database.js.map