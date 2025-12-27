"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const roadBridgeSchema = new mongoose_1.default.Schema({
    ward_id: {
        type: String,
        ref: 'Ward',
        required: [true, 'Please add ward reference'],
    },
    ward_name: {
        type: String,
        required: [true, 'Please add ward name'],
    },
    name: {
        type: String,
        required: [true, 'Please add infrastructure name'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    type: {
        type: String,
        required: [true, 'Please add infrastructure type'],
        enum: [
            'road',
            'bridge',
            'culvert',
            'tunnel',
            'flyover',
            'underpass',
            'footbridge'
        ],
    },
    category: {
        type: String,
        enum: ['national', 'provincial', 'district', 'local', 'private'],
        default: 'local',
    },
    status: {
        type: String,
        enum: ['operational', 'under_maintenance', 'closed', 'planned', 'damaged'],
        default: 'operational',
    },
    location: {
        type: String,
        required: [true, 'Please add location description'],
        maxlength: [200, 'Location description cannot exceed 200 characters'],
    },
    coordinates: {
        start: {
            latitude: Number,
            longitude: Number,
        },
        end: {
            latitude: Number,
            longitude: Number,
        },
    },
    specifications: {
        length: Number,
        width: Number,
        height: Number,
        lanes: Number,
        max_load: Number,
        speed_limit: Number,
        surface_type: {
            type: String,
            enum: ['asphalt', 'concrete', 'gravel', 'dirt', 'paved'],
        },
    },
    construction: {
        construction_year: {
            type: Number,
            min: [1800, 'Construction year must be valid'],
            max: [new Date().getFullYear() + 1, 'Construction year cannot be in the future'],
        },
        contractor: String,
        cost: Number,
        funding_source: String,
        design_standard: String,
    },
    maintenance: {
        last_inspection: Date,
        next_inspection: Date,
        last_maintenance: Date,
        next_maintenance: Date,
        maintenance_history: [{
                date: Date,
                type: {
                    type: String,
                    enum: ['routine', 'repair', 'replacement', 'emergency'],
                },
                description: String,
                cost: Number,
                contractor: String,
            }],
        condition_rating: {
            type: Number,
            min: [1, 'Condition rating must be at least 1'],
            max: [10, 'Condition rating cannot exceed 10'],
            comment: 'Overall condition rating (1-10, 10 being excellent)',
        },
    },
    traffic: {
        daily_volume: Number,
        peak_hour_volume: Number,
        vehicle_types: [{
                type: {
                    type: String,
                    enum: ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'pedestrian'],
                },
                percentage: Number,
            }],
        congestion_level: {
            type: String,
            enum: ['low', 'moderate', 'high', 'severe'],
            default: 'low',
        },
    },
    flood_vulnerability: {
        flood_risk_level: {
            type: String,
            enum: ['low', 'medium', 'high', 'very_high'],
            default: 'low',
        },
        flood_history: [{
                date: Date,
                flood_level: Number,
                damage: String,
                recovery_cost: Number,
            }],
        protective_measures: [{
                type: String,
                description: String,
                installation_date: Date,
                effectiveness: {
                    type: String,
                    enum: ['high', 'medium', 'low', 'none'],
                },
            }],
    },
    utilities: {
        has_lighting: {
            type: Boolean,
            default: false,
        },
        has_signage: {
            type: Boolean,
            default: false,
        },
        has_barriers: {
            type: Boolean,
            default: false,
        },
        has_cctv: {
            type: Boolean,
            default: false,
        },
        has_emergency_phones: {
            type: Boolean,
            default: false,
        },
    },
    environmental_impact: {
        noise_level: String,
        air_quality_impact: String,
        wildlife_disruption: String,
        green_spaces_affected: Number,
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
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
roadBridgeSchema.index({ ward_id: 1, type: 1 });
roadBridgeSchema.index({ coordinates: '2dsphere' });
roadBridgeSchema.index({ status: 1, 'maintenance.next_maintenance': 1 });
roadBridgeSchema.index({ 'flood_vulnerability.flood_risk_level': 1 });
roadBridgeSchema.virtual('infrastructureAge').get(function () {
    if (!this.construction?.construction_year)
        return null;
    return new Date().getFullYear() - this.construction.construction_year;
});
roadBridgeSchema.virtual('maintenanceUrgency').get(function () {
    if (!this.maintenance?.next_maintenance)
        return 'unknown';
    const daysUntilMaintenance = Math.ceil((this.maintenance.next_maintenance.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilMaintenance < 0)
        return 'overdue';
    if (daysUntilMaintenance <= 30)
        return 'urgent';
    if (daysUntilMaintenance <= 90)
        return 'scheduled';
    return 'normal';
});
roadBridgeSchema.methods.getAge = function () {
    if (!this.construction?.construction_year)
        return 0;
    return new Date().getFullYear() - this.construction.construction_year;
};
roadBridgeSchema.methods.needsMaintenance = function () {
    if (!this.maintenance?.next_maintenance)
        return false;
    return this.maintenance.next_maintenance <= new Date();
};
roadBridgeSchema.methods.calculateTrafficLoad = function () {
    if (!this.traffic?.daily_volume || !this.specifications?.max_load)
        return 0;
    const capacityUtilization = (this.traffic.daily_volume / 10000) * 100;
    return Math.min(100, capacityUtilization);
};
roadBridgeSchema.statics.getByWard = function (wardId) {
    return this.find({ ward_id: wardId, is_active: true });
};
roadBridgeSchema.statics.getInfrastructureStats = async function (wardId) {
    const matchStage = { is_active: true };
    if (wardId)
        matchStage.ward_id = wardId;
    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: wardId ? null : '$ward_name',
                totalInfrastructure: { $sum: 1 },
                byType: {
                    $push: '$type'
                },
                byStatus: {
                    $push: '$status'
                },
                avgCondition: { $avg: '$maintenance.condition_rating' },
                totalLength: { $sum: '$specifications.length' },
                highFloodRiskCount: {
                    $sum: {
                        $cond: [{ $eq: ['$flood_vulnerability.flood_risk_level', 'high'] }, 1, 0]
                    }
                },
                veryHighFloodRiskCount: {
                    $sum: {
                        $cond: [{ $eq: ['$flood_vulnerability.flood_risk_level', 'very_high'] }, 1, 0]
                    }
                },
            },
        },
    ]);
    return stats;
};
roadBridgeSchema.statics.getMaintenanceSchedule = function () {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return this.find({
        'maintenance.next_maintenance': { $lte: nextMonth },
        is_active: true,
    }).sort({ 'maintenance.next_maintenance': 1 });
};
exports.default = mongoose_1.default.model('RoadBridge', roadBridgeSchema);
//# sourceMappingURL=RoadBridge.js.map