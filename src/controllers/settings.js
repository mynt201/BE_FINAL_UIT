const logger = require('../utils/logger');

// In-memory settings (in production, this should be stored in database)
let systemSettings = {
    appName: 'Flood Risk Management System',
    version: '1.0.0',
    theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#64748B'
    },
    map: {
        defaultZoom: 12,
        center: [10.762622, 106.660172], // Ho Chi Minh City
        enableClustering: true
    },
    notifications: {
        email: true,
        push: false,
        sms: false
    },
    data: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionDays: 365
    },
    security: {
        sessionTimeout: 3600, // 1 hour
        passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialChars: false
        }
    }
};

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
const getSettings = async(req, res) => {
    try {
        // In production, fetch from database
        res.json({
            success: true,
            data: systemSettings
        });
    } catch (error) {
        logger.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching settings'
        });
    }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async(req, res) => {
    try {
        // Update settings (in production, save to database)
        systemSettings = {
            ...systemSettings,
            ...req.body
        };

        logger.info('System settings updated by admin:', req.user.username);

        res.json({
            success: true,
            data: systemSettings,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        logger.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while updating settings'
        });
    }
};

module.exports = {
    getSettings,
    updateSettings
};