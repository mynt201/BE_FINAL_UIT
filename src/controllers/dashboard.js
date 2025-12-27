const User = require('../models/User');
const Ward = require('../models/Ward');
const Weather = require('../models/Weather');
const RiskIndex = require('../models/RiskIndex');
const logger = require('../utils/logger');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async(req, res) => {
    try {
        // Get user statistics
        const userStats = await User.aggregate([{
            $group: {
                _id: '$role',
                count: { $sum: 1 }
            }
        }]);

        // Get ward statistics
        const wardStats = await Ward.aggregate([{
            $group: {
                _id: '$risk_level',
                count: { $sum: 1 }
            }
        }]);

        // Get recent weather data (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const weatherStats = await Weather.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: null,
                    totalRainfall: { $sum: '$rainfall' },
                    avgTemperature: { $avg: '$temperature.avg' },
                    avgHumidity: { $avg: '$humidity' },
                    recordCount: { $sum: 1 }
                }
            }
        ]);

        // Get risk index statistics (latest)
        const riskStats = await RiskIndex.aggregate([{
                $sort: { calculation_date: -1 }
            },
            {
                $group: {
                    _id: '$risk_level',
                    count: { $sum: 1 },
                    latestDate: { $first: '$calculation_date' }
                }
            }
        ]);

        // Get recent activities (last 10 users created)
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('username fullName role createdAt');

        // Get system overview
        const totalUsers = await User.countDocuments();
        const totalWards = await Ward.countDocuments({ isActive: true });
        const totalWeatherRecords = await Weather.countDocuments();
        const totalRiskRecords = await RiskIndex.countDocuments({ is_active: true });

        // Calculate risk distribution percentages
        const riskDistribution = riskStats.map(stat => ({
            level: stat._id,
            count: stat.count,
            percentage: totalWards > 0 ? ((stat.count / totalWards) * 100).toFixed(1) : 0
        }));

        const dashboardData = {
            overview: {
                totalUsers,
                totalWards,
                totalWeatherRecords,
                totalRiskRecords
            },
            userStats: userStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {}),
            wardStats: wardStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {}),
            weatherStats: weatherStats[0] || {
                totalRainfall: 0,
                avgTemperature: 0,
                avgHumidity: 0,
                recordCount: 0
            },
            riskDistribution,
            recentUsers,
            lastUpdated: new Date()
        };

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        logger.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching dashboard statistics'
        });
    }
};

module.exports = {
    getDashboardStats
};