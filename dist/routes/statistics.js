const express = require('express');
const { body, query } = require('express-validator');
const {
    getDailyStatistics,
    getMonthlyStatistics,
    getYearlyStatistics,
    getComparisonStatistics
} = require('../controllers/statistics');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const dailyStatsValidation = [
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100'),
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12')
];

const comparisonStatsValidation = [
    query('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    query('endDate').isISO8601().withMessage('End date must be a valid ISO date')
];

// Routes
router.get('/daily', dailyStatsValidation, getDailyStatistics);
router.get('/monthly', getMonthlyStatistics);
router.get('/yearly', getYearlyStatistics);
router.get('/comparison', comparisonStatsValidation, getComparisonStatistics);

module.exports = router;
