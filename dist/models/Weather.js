"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const weatherSchema = new mongoose_1.default.Schema({
    date: {
        type: Date,
        required: [true, 'Please add date'],
        index: true,
    },
    location: {
        ward_id: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Ward',
            required: [true, 'Please add ward reference'],
        },
        ward_name: {
            type: String,
            required: [true, 'Please add ward name'],
        },
        coordinates: {
            latitude: Number,
            longitude: Number,
        },
    },
    temperature: {
        min: {
            type: Number,
            required: [true, 'Please add minimum temperature'],
        },
        max: {
            type: Number,
            required: [true, 'Please add maximum temperature'],
        },
        avg: {
            type: Number,
            required: [true, 'Please add average temperature'],
        },
    },
    humidity: {
        type: Number,
        min: [0, 'Humidity cannot be less than 0%'],
        max: [100, 'Humidity cannot exceed 100%'],
    },
    rainfall: {
        type: Number,
        required: [true, 'Please add rainfall amount'],
        min: [0, 'Rainfall cannot be negative'],
    },
    wind_speed: {
        type: Number,
        min: [0, 'Wind speed cannot be negative'],
    },
    wind_direction: {
        type: String,
        enum: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
    },
    pressure: {
        type: Number,
        min: [800, 'Pressure seems too low'],
        max: [1200, 'Pressure seems too high'],
    },
    water_level: {
        type: Number,
        min: [0, 'Water level cannot be negative'],
    },
    tidal_level: {
        type: Number,
    },
    weather_condition: {
        type: String,
        enum: ['clear', 'cloudy', 'rain', 'storm', 'fog', 'snow'],
        default: 'clear',
    },
    source: {
        type: String,
        enum: ['manual', 'api', 'sensor', 'forecast'],
        default: 'manual',
    },
    is_forecast: {
        type: Boolean,
        default: false,
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound indexes for better performance
weatherSchema.index({ date: 1, 'location.ward_id': 1 });
weatherSchema.index({ 'location.ward_name': 1, date: -1 });
weatherSchema.index({ rainfall: -1, date: -1 });
weatherSchema.index({ source: 1, date: -1 });
// Virtual for temperature range
weatherSchema.virtual('temperatureRange').get(function () {
    return this.temperature.max - this.temperature.min;
});
// Virtual for weather severity based on rainfall
weatherSchema.virtual('rainSeverity').get(function () {
    if (this.rainfall >= 100)
        return 'extreme';
    if (this.rainfall >= 50)
        return 'heavy';
    if (this.rainfall >= 25)
        return 'moderate';
    if (this.rainfall >= 5)
        return 'light';
    return 'none';
});
// Static method to get weather by date range
weatherSchema.statics.getByDateRange = function (startDate, endDate, wardId = null) {
    const query = {
        date: { $gte: startDate, $lte: endDate },
    };
    if (wardId) {
        query['location.ward_id'] = wardId;
    }
    return this.find(query).sort({ date: 1 });
};
// Static method to get rainfall statistics
weatherSchema.statics.getRainfallStats = async function (startDate, endDate, wardId = null) {
    const matchStage = {
        date: { $gte: startDate, $lte: endDate },
    };
    if (wardId) {
        matchStage['location.ward_id'] = wardId;
    }
    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: wardId ? '$location.ward_name' : null,
                totalRainfall: { $sum: '$rainfall' },
                avgRainfall: { $avg: '$rainfall' },
                maxRainfall: { $max: '$rainfall' },
                minRainfall: { $min: '$rainfall' },
                rainyDays: {
                    $sum: { $cond: [{ $gt: ['$rainfall', 0] }, 1, 0] },
                },
                heavyRainDays: {
                    $sum: { $cond: [{ $gte: ['$rainfall', 50] }, 1, 0] },
                },
                totalDays: { $sum: 1 },
            },
        },
    ]);
    return stats;
};
// Static method to get latest weather data
weatherSchema.statics.getLatest = function (wardId = null, limit = 1) {
    const query = {};
    if (wardId) {
        query['location.ward_id'] = wardId;
    }
    return this.find(query).sort({ date: -1 }).limit(limit);
};
exports.default = mongoose_1.default.model('Weather', weatherSchema);
//# sourceMappingURL=Weather.js.map