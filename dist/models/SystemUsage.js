"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const systemUsageSchema = new mongoose_1.default.Schema({
    user_id: {
        type: String,
        ref: 'User',
        required: [true, 'Please add user reference'],
    },
    ward_id: {
        type: String,
        ref: 'Ward',
    },
    action: {
        type: String,
        required: [true, 'Please add action type'],
        enum: [
            'login',
            'logout',
            'view_map',
            'view_risk_report',
            'export_data',
            'create_user',
            'update_user',
            'delete_user',
            'update_ward_data',
            'update_weather_data',
            'update_risk_index',
            'view_statistics',
            'view_dashboard',
            'update_settings',
            'upload_file',
            'download_report'
        ],
    },
    action_details: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    ip_address: {
        type: String,
        required: [true, 'Please add IP address'],
    },
    user_agent: {
        type: String,
    },
    session_id: {
        type: String,
    },
    start_time: {
        type: Date,
        default: Date.now,
        required: true,
    },
    end_time: {
        type: Date,
    },
    duration_ms: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['success', 'error', 'warning', 'info'],
        default: 'success',
    },
    error_message: {
        type: String,
    },
    resource_type: {
        type: String,
        enum: ['user', 'ward', 'weather', 'risk_index', 'settings', 'system'],
    },
    resource_id: {
        type: String,
    },
    location: {
        latitude: Number,
        longitude: Number,
        address: String,
    },
    device_info: {
        browser: String,
        os: String,
        device: String,
        screen_resolution: String,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
systemUsageSchema.index({ user_id: 1, start_time: -1 });
systemUsageSchema.index({ ward_id: 1, start_time: -1 });
systemUsageSchema.index({ action: 1, start_time: -1 });
systemUsageSchema.index({ session_id: 1 });
systemUsageSchema.index({ start_time: -1, end_time: -1 });
systemUsageSchema.virtual('formattedDuration').get(function () {
    if (!this.duration_ms)
        return 'N/A';
    const seconds = Math.floor(this.duration_ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0)
        return `${hours}h ${minutes % 60}m`;
    if (minutes > 0)
        return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
});
systemUsageSchema.methods.getDuration = function () {
    if (this.end_time && this.start_time) {
        return this.end_time.getTime() - this.start_time.getTime();
    }
    return 0;
};
systemUsageSchema.pre('save', function (next) {
    if (this.end_time && this.start_time) {
        this.duration_ms = this.end_time.getTime() - this.start_time.getTime();
    }
    next();
});
systemUsageSchema.statics.getUserActivity = function (userId, startDate, endDate) {
    return this.find({
        user_id: userId,
        start_time: { $gte: startDate, $lte: endDate },
    }).sort({ start_time: -1 });
};
systemUsageSchema.statics.getWardActivity = function (wardId, startDate, endDate) {
    return this.find({
        ward_id: wardId,
        start_time: { $gte: startDate, $lte: endDate },
    }).sort({ start_time: -1 });
};
systemUsageSchema.statics.getActivityStats = async function (startDate, endDate) {
    const stats = await this.aggregate([
        {
            $match: {
                start_time: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: {
                    action: '$action',
                    status: '$status',
                },
                count: { $sum: 1 },
                avgDuration: { $avg: '$duration_ms' },
                totalDuration: { $sum: '$duration_ms' },
            },
        },
        {
            $sort: { count: -1 },
        },
    ]);
    return stats;
};
exports.default = mongoose_1.default.model('SystemUsage', systemUsageSchema);
//# sourceMappingURL=SystemUsage.js.map