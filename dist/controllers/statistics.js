const Weather = require('../models/Weather');
const RiskIndex = require('../models/RiskIndex');
const Ward = require('../models/Ward');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Helper function to calculate risk index
const calculateRiskIndex = (exposure, susceptibility, resilience) => {
    return Math.min((exposure * susceptibility) / Math.max(resilience, 1), 5);
};

// Helper function to get risk level
const getRiskLevel = (score) => {
    if (score >= 4) return 'very_high';
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    if (score >= 1) return 'low';
    return 'very_low';
};

// @desc    Get daily statistics
// @route   GET /api/statistics/daily
// @access  Private
const getDailyStatistics = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyStats = [];

        // Get all wards
        const wards = await Ward.find({ isActive: true });

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);

            // Get weather data for this day
            const weatherData = await Weather.find({
                date: date,
                'location.ward_id': { $in: wards.map(w => w._id) }
            });

            // Calculate statistics
            const rainfall = weatherData.reduce((sum, w) => sum + w.rainfall, 0) / Math.max(weatherData.length, 1);
            const avgWaterLevel = weatherData.reduce((sum, w) => sum + (w.water_level || 0), 0) / Math.max(weatherData.length, 1);

            // Calculate risk for each ward
            const wardRisks = wards.map(ward => {
                const wardWeather = weatherData.find(w => w.location.ward_id.toString() === ward._id.toString());
                const exposure = ward.population_density / 1000 + (wardWeather?.rainfall || 0) / 200;
                const susceptibility = ward.low_elevation + ward.urban_land;
                const resilience = ward.drainage_capacity || 1;

                const riskScore = calculateRiskIndex(exposure, susceptibility, resilience);
                return {
                    ward_name: ward.ward_name,
                    risk_score: riskScore,
                    risk_level: getRiskLevel(riskScore)
                };
            });

            // Count risk levels
            const highRisk = wardRisks.filter(w => w.risk_level === 'high' || w.risk_level === 'very_high').length;
            const mediumRisk = wardRisks.filter(w => w.risk_level === 'medium').length;
            const lowRisk = wardRisks.filter(w => w.risk_level !== 'high' && w.risk_level !== 'very_high' && w.risk_level !== 'medium').length;

            dailyStats.push({
                day,
                date: date.toISOString().split('T')[0],
                rainfall: Math.round(rainfall * 100) / 100,
                avgWaterLevel: Math.round(avgWaterLevel * 100) / 100,
                highRisk,
                mediumRisk,
                lowRisk,
                avgRisk: wardRisks.reduce((sum, w) => sum + w.risk_score, 0) / wardRisks.length,
                wardDetails: wardRisks
            });
        }

        res.json({
            success: true,
            data: {
                year,
                month,
                monthName: new Date(year, month - 1).toLocaleDateString('vi-VN', { month: 'long' }),
                dailyStats
            }
        });
    } catch (error) {
        logger.error('Get daily statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching daily statistics'
        });
    }
};

// @desc    Get monthly statistics
// @route   GET /api/statistics/monthly
// @access  Private
const getMonthlyStatistics = async(req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const monthlyStats = [];
        const monthNames = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];

        // Get all wards
        const wards = await Ward.find({ isActive: true });

        for (let month = 1; month <= 12; month++) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            // Get weather data for this month
            const weatherData = await Weather.find({
                date: { $gte: startDate, $lte: endDate },
                'location.ward_id': { $in: wards.map(w => w._id) }
            });

            // Calculate monthly statistics
            const totalRainfall = weatherData.reduce((sum, w) => sum + w.rainfall, 0);
            const avgRainfall = totalRainfall / Math.max(weatherData.length, 1);
            const rainyDays = weatherData.filter(w => w.rainfall > 0).length;

            // Calculate risk statistics
            let totalRisk = 0;
            let highRiskDays = 0;

            for (let day = 1; day <= endDate.getDate(); day++) {
                const date = new Date(year, month - 1, day);
                const dayWeather = weatherData.filter(w => w.date.toDateString() === date.toDateString());

                if (dayWeather.length > 0) {
                    const dayRisks = wards.map(ward => {
                        const wardWeather = dayWeather.find(w => w.location.ward_id.toString() === ward._id.toString());
                        const exposure = ward.population_density / 1000 + (wardWeather?.rainfall || 0) / 200;
                        const susceptibility = ward.low_elevation + ward.urban_land;
                        const resilience = ward.drainage_capacity || 1;

                        return calculateRiskIndex(exposure, susceptibility, resilience);
                    });

                    const avgDayRisk = dayRisks.reduce((sum, r) => sum + r, 0) / dayRisks.length;
                    totalRisk += avgDayRisk;

                    if (avgDayRisk >= 3) highRiskDays++;
                }
            }

            const avgRisk = totalRisk / endDate.getDate();

            monthlyStats.push({
                month,
                monthName: monthNames[month - 1],
                avgRainfall: Math.round(avgRainfall * 100) / 100,
                totalRainfall: Math.round(totalRainfall * 100) / 100,
                avgRisk: Math.round(avgRisk * 100) / 100,
                highRiskDays,
                rainyDays,
                totalDays: endDate.getDate()
            });
        }

        res.json({
            success: true,
            data: {
                year,
                monthlyStats
            }
        });
    } catch (error) {
        logger.error('Get monthly statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching monthly statistics'
        });
    }
};

// @desc    Get yearly statistics
// @route   GET /api/statistics/yearly
// @access  Private
const getYearlyStatistics = async(req, res) => {
    try {
        const startYear = parseInt(req.query.startYear) || (new Date().getFullYear() - 4);
        const endYear = parseInt(req.query.endYear) || new Date().getFullYear();

        const yearlyStats = [];

        // Get all wards
        const wards = await Ward.find({ isActive: true });

        for (let year = startYear; year <= endYear; year++) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);

            // Get weather data for this year
            const weatherData = await Weather.find({
                date: { $gte: startDate, $lte: endDate },
                'location.ward_id': { $in: wards.map(w => w._id) }
            });

            // Calculate yearly statistics
            const totalRainfall = weatherData.reduce((sum, w) => sum + w.rainfall, 0);
            const rainyDays = weatherData.filter(w => w.rainfall > 0).length;

            // Calculate monthly risk data
            const monthlyRisks = [];
            for (let month = 0; month < 12; month++) {
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
                const monthWeather = weatherData.filter(w =>
                    w.date >= monthStart && w.date <= monthEnd
                );

                if (monthWeather.length > 0) {
                    const monthRisks = wards.map(ward => {
                        const wardWeather = monthWeather.filter(w =>
                            w.location.ward_id.toString() === ward._id.toString()
                        );
                        const avgRainfall = wardWeather.reduce((sum, w) => sum + w.rainfall, 0) / Math.max(wardWeather.length, 1);

                        const exposure = ward.population_density / 1000 + avgRainfall / 200;
                        const susceptibility = ward.low_elevation + ward.urban_land;
                        const resilience = ward.drainage_capacity || 1;

                        return calculateRiskIndex(exposure, susceptibility, resilience);
                    });

                    monthlyRisks.push(monthRisks.reduce((sum, r) => sum + r, 0) / monthRisks.length);
                }
            }

            const avgRisk = monthlyRisks.reduce((sum, r) => sum + r, 0) / Math.max(monthlyRisks.length, 1);
            const highRiskMonths = monthlyRisks.filter(r => r >= 3).length;

            yearlyStats.push({
                year,
                totalRainfall: Math.round(totalRainfall),
                avgRisk: Math.round(avgRisk * 100) / 100,
                highRiskMonths,
                rainyDays,
                monthlyRisks: monthlyRisks.map(r => Math.round(r * 100) / 100)
            });
        }

        res.json({
            success: true,
            data: {
                startYear,
                endYear,
                yearlyStats
            }
        });
    } catch (error) {
        logger.error('Get yearly statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching yearly statistics'
        });
    }
};

// @desc    Get comparison statistics
// @route   GET /api/statistics/comparison
// @access  Private
const getComparisonStatistics = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);

        // Calculate period split
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const period1End = new Date(startDate.getTime() + (totalDays / 2) * 24 * 60 * 60 * 1000);

        const period1 = {
            start: startDate,
            end: period1End,
            label: `Giai đoạn 1 (${startDate.toLocaleDateString('vi-VN')} - ${period1End.toLocaleDateString('vi-VN')})`
        };

        const period2 = {
            start: period1End,
            end: endDate,
            label: `Giai đoạn 2 (${period1End.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')})`
        };

        // Get all wards
        const wards = await Ward.find({ isActive: true });

        // Calculate statistics for each period
        const calculatePeriodStats = async(period) => {
            const weatherData = await Weather.find({
                date: { $gte: period.start, $lte: period.end },
                'location.ward_id': { $in: wards.map(w => w._id) }
            });

            const totalRainfall = weatherData.reduce((sum, w) => sum + w.rainfall, 0);
            const avgRainfall = totalRainfall / Math.max(weatherData.length, 1);

            // Calculate daily risks
            const dailyRisks = [];
            const days = Math.ceil((period.end - period.start) / (1000 * 60 * 60 * 24));

            for (let i = 0; i < days; i++) {
                const date = new Date(period.start.getTime() + i * 24 * 60 * 60 * 1000);
                const dayWeather = weatherData.filter(w =>
                    w.date.toDateString() === date.toDateString()
                );

                if (dayWeather.length > 0) {
                    const dayRisks = wards.map(ward => {
                        const wardWeather = dayWeather.find(w =>
                            w.location.ward_id.toString() === ward._id.toString()
                        );
                        const exposure = ward.population_density / 1000 + (wardWeather?.rainfall || 0) / 200;
                        const susceptibility = ward.low_elevation + ward.urban_land;
                        const resilience = ward.drainage_capacity || 1;

                        return calculateRiskIndex(exposure, susceptibility, resilience);
                    });

                    dailyRisks.push(dayRisks.reduce((sum, r) => sum + r, 0) / dayRisks.length);
                }
            }

            const avgRisk = dailyRisks.reduce((sum, r) => sum + r, 0) / Math.max(dailyRisks.length, 1);
            const highRiskDays = dailyRisks.filter(r => r >= 3).length;
            const maxRisk = Math.max(...dailyRisks);
            const minRisk = Math.min(...dailyRisks);

            return {
                avgRainfall: Math.round(avgRainfall * 100) / 100,
                avgRisk: Math.round(avgRisk * 100) / 100,
                highRiskDays,
                totalDays: days,
                maxRisk: Math.round(maxRisk * 100) / 100,
                minRisk: Math.round(minRisk * 100) / 100
            };
        };

        const period1Stats = await calculatePeriodStats(period1);
        const period2Stats = await calculatePeriodStats(period2);

        // Calculate changes
        const changes = {
            rainfall: Math.round(((period2Stats.avgRainfall - period1Stats.avgRainfall) / Math.max(period1Stats.avgRainfall, 1)) * 10000) / 100,
            risk: Math.round(((period2Stats.avgRisk - period1Stats.avgRisk) / Math.max(period1Stats.avgRisk, 1)) * 10000) / 100,
            highRiskDays: period2Stats.highRiskDays - period1Stats.highRiskDays
        };

        res.json({
            success: true,
            data: {
                period1: {...period1Stats, label: period1.label },
                period2: {...period2Stats, label: period2.label },
                changes
            }
        });
    } catch (error) {
        logger.error('Get comparison statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching comparison statistics'
        });
    }
};

module.exports = {
    getDailyStatistics,
    getMonthlyStatistics,
    getYearlyStatistics,
    getComparisonStatistics
};