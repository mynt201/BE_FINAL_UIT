"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const statisticsRoutes = require('./routes/statistics');
const dataRoutes = require('./routes/data');
const settingsRoutes = require('./routes/settings');
const externalApisRoutes = require('./routes/externalApis');
const app = express();
(0, database_1.default)();
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
const limiter = rateLimit({
    windowMs: (Number(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/health', (req, res) => {
    const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
    };
    res.status(200).json({
        success: true,
        data: healthData,
    });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/external', externalApisRoutes);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});
app.use(errorHandler_1.default);
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    logger_1.logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Promise Rejection:', reason);
    server.close(() => {
        process.exit(1);
    });
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error('Uncaught Exception:', err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=server.js.map