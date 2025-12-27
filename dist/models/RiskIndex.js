"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const riskIndexSchema = new mongoose_1.default.Schema({
    ward_id: {
        type: String,
        ref: 'Ward',
        required: [true, 'Please add ward reference'],
    },
    ward_name: {
        type: String,
        required: [true, 'Please add ward name'],
    },
    calculation_date: {
        type: Date,
        required: [true, 'Please add calculation date'],
        default: Date.now,
        index: true,
    },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: [true, 'Please add calculation period'],
    },
    exposure: {
        type: Number,
        required: [true, 'Please add exposure value'],
        min: [0, 'Exposure cannot be negative'],
    },
    susceptibility: {
        type: Number,
        required: [true, 'Please add susceptibility value'],
        min: [0, 'Susceptibility cannot be negative'],
    },
    resilience: {
        type: Number,
        required: [true, 'Please add resilience value'],
        min: [0, 'Resilience cannot be negative'],
    },
    risk_score: {
        type: Number,
        required: [true, 'Please add risk score'],
        min: [0, 'Risk score cannot be negative'],
        max: [5, 'Risk score cannot exceed 5'],
    },
    risk_level: {
        type: String,
        enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
        required: [true, 'Please add risk level'],
    },
    factors: {
        population_density: Number,
        low_elevation: Number,
        urban_land: Number,
        drainage_capacity: Number,
        rainfall: Number,
        water_level: Number,
        weather_condition: String,
    },
    trend: {
        previous_score: Number,
        change_percentage: Number,
        trend_direction: {
            type: String,
            enum: ['increasing', 'decreasing', 'stable'],
        },
    },
    coordinates: {
        latitude: Number,
        longitude: Number,
    },
    calculation_method: {
        type: String,
        enum: ['standard', 'advanced', 'custom'],
        default: 'standard',
    },
    data_sources: [
        {
            type: String,
            enum: ['ward_data', 'weather_data', 'sensor_data', 'manual_input'],
        },
    ],
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    is_active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
riskIndexSchema.index({ ward_id: 1, calculation_date: -1 });
riskIndexSchema.index({ risk_level: 1, calculation_date: -1 });
riskIndexSchema.index({ period: 1, calculation_date: -1 });
riskIndexSchema.index({ risk_score: -1 });
riskIndexSchema.virtual('riskLevelDescription').get(function () {
    const descriptions = {
        very_low: 'Rủi ro rất thấp',
        low: 'Rủi ro thấp',
        medium: 'Rủi ro trung bình',
        high: 'Rủi ro cao',
        very_high: 'Rủi ro rất cao',
    };
    return descriptions[this.risk_level] || 'Không xác định';
});
riskIndexSchema.pre('save', function (next) {
    if (this.isModified('risk_score')) {
        if (this.risk_score >= 4.0) {
            this.risk_level = 'very_high';
        }
        else if (this.risk_score >= 3.0) {
            this.risk_level = 'high';
        }
        else if (this.risk_score >= 2.0) {
            this.risk_level = 'medium';
        }
        else if (this.risk_score >= 1.0) {
            this.risk_level = 'low';
        }
        else {
            this.risk_level = 'very_low';
        }
    }
    next();
});
riskIndexSchema.statics.getLatestByWard = function (wardId, period = null) {
    const query = { ward_id: wardId, is_active: true };
    if (period) {
        query.period = period;
    }
    return this.findOne(query).sort({ calculation_date: -1 });
};
riskIndexSchema.statics.getRiskDistribution = async function (startDate, endDate, period = null) {
    const matchStage = {
        calculation_date: { $gte: startDate, $lte: endDate },
        is_active: true,
    };
    if (period) {
        matchStage.period = period;
    }
    const distribution = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$risk_level',
                count: { $sum: 1 },
                avgScore: { $avg: '$risk_score' },
                maxScore: { $max: '$risk_score' },
                minScore: { $min: '$risk_score' },
            },
        },
        { $sort: { avgScore: -1 } },
    ]);
    return distribution;
};
riskIndexSchema.statics.getRiskTrends = async function (wardId, startDate, endDate, period = 'daily') {
    const trends = await this.aggregate([
        {
            $match: {
                ward_id: wardId,
                period: period,
                calculation_date: { $gte: startDate, $lte: endDate },
                is_active: true,
            },
        },
        { $sort: { calculation_date: 1 } },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: period === 'yearly' ? '%Y' : period === 'monthly' ? '%Y-%m' : '%Y-%m-%d',
                        date: '$calculation_date',
                    },
                },
                avgRisk: { $avg: '$risk_score' },
                maxRisk: { $max: '$risk_score' },
                minRisk: { $min: '$risk_score' },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    return trends;
};
riskIndexSchema.methods.calculateTrend = async function () {
    const RiskIndex = this.constructor;
    const previousRecord = await RiskIndex
        .findOne({
        ward_id: this.ward_id,
        period: this.period,
        calculation_date: { $lt: this.calculation_date },
        is_active: true,
    })
        .sort({ calculation_date: -1 });
    if (previousRecord) {
        const change = this.risk_score - previousRecord.risk_score;
        const changePercentage = (change / previousRecord.risk_score) * 100;
        this.trend = {
            previous_score: previousRecord.risk_score,
            change_percentage: changePercentage,
            trend_direction: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable',
        };
    }
    return this;
};
exports.default = mongoose_1.default.model('RiskIndex', riskIndexSchema);
//# sourceMappingURL=RiskIndex.js.map