const express = require('express');
const { query } = require('express-validator');
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
const dateValidation = [
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('startYear')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Start year must be between 2000 and 2100'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
];

// Routes
router.get('/daily', dateValidation, getDailyStatistics);
router.get('/monthly', [query('year').optional().isInt({ min: 2000, max: 2100 })], getMonthlyStatistics);
router.get('/yearly', [
  query('startYear').optional().isInt({ min: 2000, max: 2100 }),
  query('endYear').optional().isInt({ min: 2000, max: 2100 })
], getYearlyStatistics);
router.get('/comparison', [
  query('startDate').isISO8601().withMessage('Start date is required and must be valid'),
  query('endDate').isISO8601().withMessage('End date is required and must be valid')
], getComparisonStatistics);

module.exports = router;
