"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const wardSchema = new mongoose_1.default.Schema({
    ward_name: {
        type: String,
        required: [true, 'Please add ward name'],
        unique: true,
        trim: true,
        maxlength: [100, 'Ward name cannot exceed 100 characters'],
    },
    district: {
        type: String,
        required: [true, 'Please add district'],
        trim: true,
        maxlength: [100, 'District name cannot exceed 100 characters'],
    },
    population_density: {
        type: Number,
        required: [true, 'Please add population density'],
        min: [0, 'Population density cannot be negative'],
    },
    low_elevation: {
        type: Number,
        required: [true, 'Please add low elevation'],
        min: [0, 'Low elevation cannot be negative'],
    },
    drainage_capacity: {
        type: Number,
        min: [0, 'Drainage capacity cannot be negative'],
    },
    urban_land: {
        type: Number,
        required: [true, 'Please add urban land percentage'],
        min: [0, 'Urban land cannot be negative'],
        max: [100, 'Urban land cannot exceed 100%'],
    },
    coordinates: {
        latitude: {
            type: Number,
            required: [true, 'Please add latitude'],
            min: [-90, 'Latitude must be between -90 and 90'],
            max: [90, 'Latitude must be between -90 and 90'],
        },
        longitude: {
            type: Number,
            required: [true, 'Please add longitude'],
            min: [-180, 'Longitude must be between -180 and 180'],
            max: [180, 'Longitude must be between -180 and 180'],
        },
    },
    area_km2: {
        type: Number,
        min: [0, 'Area cannot be negative'],
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    risk_level: {
        type: String,
        enum: ['low', 'medium', 'high', 'very_high'],
        default: 'low',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Index for better performance
wardSchema.index({ ward_name: 1 });
wardSchema.index({ district: 1 });
wardSchema.index({ risk_level: 1 });
wardSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
// Virtual for risk calculation (basic calculation)
wardSchema.virtual('calculatedRisk').get(function () {
    if (!this.population_density || !this.low_elevation || !this.urban_land) {
        return 0;
    }
    // Basic risk calculation formula
    const exposure = this.population_density / 1000 + this.urban_land / 100;
    const susceptibility = this.low_elevation + this.urban_land / 10;
    const resilience = this.drainage_capacity || 1;
    const risk = (exposure * susceptibility) / resilience;
    return Math.min(risk, 5); // Cap at 5
});
// Pre-save middleware to update risk level
wardSchema.pre('save', function (next) {
    if (this.isModified('population_density') ||
        this.isModified('low_elevation') ||
        this.isModified('urban_land') ||
        this.isModified('drainage_capacity')) {
        const risk = this.calculatedRisk;
        if (risk >= 4) {
            this.risk_level = 'very_high';
        }
        else if (risk >= 3) {
            this.risk_level = 'high';
        }
        else if (risk >= 2) {
            this.risk_level = 'medium';
        }
        else {
            this.risk_level = 'low';
        }
    }
    next();
});
// Static method to get wards by risk level
wardSchema.statics.getByRiskLevel = function (level) {
    return this.find({ risk_level: level, isActive: true });
};
// Static method to get statistics
wardSchema.statics.getStatistics = async function () {
    const stats = await this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$risk_level',
                count: { $sum: 1 },
                avgPopulationDensity: { $avg: '$population_density' },
                avgLowElevation: { $avg: '$low_elevation' },
                totalArea: { $sum: '$area_km2' },
            },
        },
    ]);
    return stats;
};
exports.default = mongoose_1.default.model('Ward', wardSchema);
//# sourceMappingURL=Ward.js.map