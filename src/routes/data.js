const express = require('express');
const { query, param, body } = require('express-validator');
const {
    getWards,
    createWard,
    updateWard,
    deleteWard,
    getWeatherData,
    createWeatherData,
    updateWeatherData,
    deleteWeatherData,
    getRiskIndices,
    createRiskIndex,
    updateRiskIndex,
    deleteRiskIndex
} = require('../controllers/data');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Ward routes
router.route('/wards')
    .get(query('page').optional().isInt({ min: 1 }), getWards)
    .post(authorize('admin'), body('ward_name').notEmpty(), createWard);

router.route('/wards/:id')
    .put(authorize('admin'), param('id').isMongoId(), updateWard)
    .delete(authorize('admin'), param('id').isMongoId(), deleteWard);

// Weather routes
router.route('/weather')
    .get([
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('ward_id').optional().isMongoId()
    ], getWeatherData)
    .post(authorize('admin'), body('date').isISO8601(), createWeatherData);

router.route('/weather/:id')
    .put(authorize('admin'), param('id').isMongoId(), updateWeatherData)
    .delete(authorize('admin'), param('id').isMongoId(), deleteWeatherData);

// Risk Index routes
router.route('/risk-index')
    .get([
        query('ward_id').optional().isMongoId(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ], getRiskIndices)
    .post(authorize('admin'), body('ward_id').isMongoId(), createRiskIndex);

router.route('/risk-index/:id')
    .put(authorize('admin'), param('id').isMongoId(), updateRiskIndex)
    .delete(authorize('admin'), param('id').isMongoId(), deleteRiskIndex);

module.exports = router;