const { validationResult } = require('express-validator');
const Ward = require('../models/Ward');
const Weather = require('../models/Weather');
const RiskIndex = require('../models/RiskIndex');
const logger = require('../utils/logger');

// @desc    Get all wards
// @route   GET /api/data/wards
// @access  Private
const getWards = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const startIndex = (page - 1) * limit;

        const wards = await Ward.find({ isActive: true })
            .sort({ ward_name: 1 })
            .limit(limit)
            .skip(startIndex);

        const total = await Ward.countDocuments({ isActive: true });

        res.json({
            success: true,
            data: wards,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalWards: total
            }
        });
    } catch (error) {
        logger.error('Get wards error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching wards'
        });
    }
};

// @desc    Create ward
// @route   POST /api/data/wards
// @access  Private/Admin
const createWard = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const ward = await Ward.create(req.body);

        logger.info(`Ward created: ${ward.ward_name}`);

        res.status(201).json({
            success: true,
            data: ward
        });
    } catch (error) {
        logger.error('Create ward error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while creating ward'
        });
    }
};

// @desc    Update ward
// @route   PUT /api/data/wards/:id
// @access  Private/Admin
const updateWard = async(req, res) => {
    try {
        const ward = await Ward.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true, runValidators: true }
        );

        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        logger.info(`Ward updated: ${ward.ward_name}`);

        res.json({
            success: true,
            data: ward
        });
    } catch (error) {
        logger.error('Update ward error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while updating ward'
        });
    }
};

// @desc    Delete ward
// @route   DELETE /api/data/wards/:id
// @access  Private/Admin
const deleteWard = async(req, res) => {
    try {
        const ward = await Ward.findByIdAndUpdate(
            req.params.id, { isActive: false }, { new: true }
        );

        if (!ward) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        logger.info(`Ward deactivated: ${ward.ward_name}`);

        res.json({
            success: true,
            message: 'Ward deactivated successfully'
        });
    } catch (error) {
        logger.error('Delete ward error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting ward'
        });
    }
};

// Weather data controllers
const getWeatherData = async(req, res) => {
    try {
        const { startDate, endDate, ward_id } = req.query;

        let query = {};
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (ward_id) {
            query['location.ward_id'] = ward_id;
        }

        const weatherData = await Weather.find(query)
            .populate('location.ward_id', 'ward_name')
            .sort({ date: -1 })
            .limit(1000);

        res.json({
            success: true,
            data: weatherData
        });
    } catch (error) {
        logger.error('Get weather data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching weather data'
        });
    }
};

const createWeatherData = async(req, res) => {
    try {
        const weatherData = await Weather.create(req.body);

        logger.info(`Weather data created for date: ${weatherData.date}`);

        res.status(201).json({
            success: true,
            data: weatherData
        });
    } catch (error) {
        logger.error('Create weather data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while creating weather data'
        });
    }
};

const updateWeatherData = async(req, res) => {
    try {
        const weatherData = await Weather.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true, runValidators: true }
        );

        if (!weatherData) {
            return res.status(404).json({
                success: false,
                error: 'Weather data not found'
            });
        }

        res.json({
            success: true,
            data: weatherData
        });
    } catch (error) {
        logger.error('Update weather data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while updating weather data'
        });
    }
};

const deleteWeatherData = async(req, res) => {
    try {
        await Weather.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Weather data deleted successfully'
        });
    } catch (error) {
        logger.error('Delete weather data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting weather data'
        });
    }
};

// Risk Index controllers
const getRiskIndices = async(req, res) => {
    try {
        const { ward_id, startDate, endDate } = req.query;

        let query = { is_active: true };
        if (ward_id) query.ward_id = ward_id;
        if (startDate && endDate) {
            query.calculation_date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const riskIndices = await RiskIndex.find(query)
            .populate('ward_id', 'ward_name')
            .sort({ calculation_date: -1 })
            .limit(1000);

        res.json({
            success: true,
            data: riskIndices
        });
    } catch (error) {
        logger.error('Get risk indices error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching risk indices'
        });
    }
};

const createRiskIndex = async(req, res) => {
    try {
        const riskIndex = await RiskIndex.create(req.body);

        logger.info(`Risk index created for ward: ${riskIndex.ward_name}`);

        res.status(201).json({
            success: true,
            data: riskIndex
        });
    } catch (error) {
        logger.error('Create risk index error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while creating risk index'
        });
    }
};

const updateRiskIndex = async(req, res) => {
    try {
        const riskIndex = await RiskIndex.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true, runValidators: true }
        );

        if (!riskIndex) {
            return res.status(404).json({
                success: false,
                error: 'Risk index not found'
            });
        }

        res.json({
            success: true,
            data: riskIndex
        });
    } catch (error) {
        logger.error('Update risk index error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while updating risk index'
        });
    }
};

const deleteRiskIndex = async(req, res) => {
    try {
        await RiskIndex.findByIdAndUpdate(
            req.params.id, { is_active: false }, { new: true }
        );

        res.json({
            success: true,
            message: 'Risk index deactivated successfully'
        });
    } catch (error) {
        logger.error('Delete risk index error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting risk index'
        });
    }
};

module.exports = {
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
};