import mongoose, { Document, Model } from 'mongoose';
import { IDrainageSystem } from '../types';

// Interface for DrainageSystem Document
interface IDrainageSystemDocument extends Omit<IDrainageSystem, '_id'>, Document {
  getCapacityUtilization(): number;
  calculateEfficiency(): number;
}

// Interface for DrainageSystem Model
interface IDrainageSystemModel extends Model<IDrainageSystemDocument> {
  getByWard(wardId: string): Promise<IDrainageSystemDocument[]>;
  getSystemStats(wardId?: string): Promise<any>;
}

const drainageSystemSchema = new mongoose.Schema<IDrainageSystemDocument>(
  {
    ward_id: {
      type: String,
      ref: 'Ward',
      required: [true, 'Please add ward reference'],
    },
    ward_name: {
      type: String,
      required: [true, 'Please add ward name'],
    },
    system_name: {
      type: String,
      required: [true, 'Please add system name'],
      maxlength: [100, 'System name cannot exceed 100 characters'],
    },
    system_type: {
      type: String,
      required: [true, 'Please add system type'],
      enum: [
        'surface_drainage',
        'underground_drainage',
        'combined_system',
        'stormwater_management',
        'sewer_system'
      ],
    },
    location: {
      type: String,
      required: [true, 'Please add location description'],
      maxlength: [200, 'Location description cannot exceed 200 characters'],
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
    design_capacity: {
      type: Number,
      required: [true, 'Please add design capacity'],
      min: [0, 'Design capacity cannot be negative'],
      comment: 'Capacity in cubic meters per hour (m³/h)',
    },
    current_flow_rate: {
      type: Number,
      min: [0, 'Current flow rate cannot be negative'],
      comment: 'Current flow rate in cubic meters per hour (m³/h)',
    },
    material: {
      type: String,
      enum: [
        'concrete',
        'plastic',
        'metal',
        'brick',
        'composite',
        'natural'
      ],
    },
    installation_year: {
      type: Number,
      min: [1900, 'Installation year must be valid'],
      max: [new Date().getFullYear() + 1, 'Installation year cannot be in the future'],
    },
    last_maintenance: {
      type: Date,
    },
    next_maintenance: {
      type: Date,
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
      default: 'good',
    },
    blockages: [{
      date: Date,
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'severe'],
      },
      description: String,
      resolved: {
        type: Boolean,
        default: false,
      },
      resolved_date: Date,
    }],
    pumps: [{
      pump_id: String,
      capacity: Number, // m³/h
      power: Number, // kW
      operational: {
        type: Boolean,
        default: true,
      },
      last_service: Date,
    }],
    monitoring_stations: [{
      station_id: String,
      location: String,
      sensors: [{
        type: {
          type: String,
          enum: ['water_level', 'flow_rate', 'pressure', 'quality'],
        },
        operational: {
          type: Boolean,
          default: true,
        },
        last_reading: Number,
        last_reading_date: Date,
      }],
    }],
    coverage_area: {
      type: Number, // Area in square kilometers
      min: [0, 'Coverage area cannot be negative'],
    },
    efficiency_rating: {
      type: Number,
      min: [0, 'Efficiency rating cannot be less than 0'],
      max: [100, 'Efficiency rating cannot exceed 100'],
      comment: 'Efficiency percentage (0-100)',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
drainageSystemSchema.index({ ward_id: 1, system_type: 1 });
drainageSystemSchema.index({ coordinates: '2dsphere' });
drainageSystemSchema.index({ condition: 1, last_maintenance: -1 });
drainageSystemSchema.index({ 'pumps.operational': 1 });

// Virtual for age of system
drainageSystemSchema.virtual('systemAge').get(function () {
  if (!this.installation_year) return null;
  return new Date().getFullYear() - this.installation_year;
});

// Virtual for days since last maintenance
drainageSystemSchema.virtual('daysSinceMaintenance').get(function () {
  if (!this.last_maintenance) return null;
  const diffTime = Math.abs(new Date().getTime() - this.last_maintenance.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to calculate capacity utilization
drainageSystemSchema.methods.getCapacityUtilization = function () {
  if (!this.current_flow_rate || !this.design_capacity) return 0;
  return (this.current_flow_rate / this.design_capacity) * 100;
};

// Instance method to calculate efficiency
drainageSystemSchema.methods.calculateEfficiency = function () {
  // Basic efficiency calculation based on condition and maintenance
  let baseEfficiency = 100;

  // Reduce efficiency based on condition
  switch (this.condition) {
    case 'excellent':
      baseEfficiency = 95;
      break;
    case 'good':
      baseEfficiency = 85;
      break;
    case 'fair':
      baseEfficiency = 70;
      break;
    case 'poor':
      baseEfficiency = 50;
      break;
    case 'critical':
      baseEfficiency = 20;
      break;
  }

  // Reduce efficiency if overdue maintenance
  if (this.daysSinceMaintenance && this.daysSinceMaintenance > 365) {
    baseEfficiency -= 15;
  }

  // Reduce efficiency for blockages
  const unresolvedBlockages = this.blockages.filter((b: { resolved: boolean }) => !b.resolved).length;
  baseEfficiency -= unresolvedBlockages * 5;

  // Ensure efficiency doesn't go below 0
  return Math.max(0, Math.min(100, baseEfficiency));
};

// Static method to get systems by ward
drainageSystemSchema.statics.getByWard = function (wardId: string) {
  return this.find({ ward_id: wardId, is_active: true });
};

// Static method to get system statistics
drainageSystemSchema.statics.getSystemStats = async function (wardId?: string) {
  const matchStage: any = { is_active: true };
  if (wardId) matchStage.ward_id = wardId;

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: wardId ? null : '$ward_name',
        totalSystems: { $sum: 1 },
        avgCapacity: { $avg: '$design_capacity' },
        totalCapacity: { $sum: '$design_capacity' },
        systemsByType: {
          $push: '$system_type'
        },
        systemsByCondition: {
          $push: '$condition'
        },
        avgEfficiency: { $avg: '$efficiency_rating' },
        coverageArea: { $sum: '$coverage_area' },
      },
    },
  ]);

  return stats;
};

export default mongoose.model<IDrainageSystemDocument, IDrainageSystemModel>(
  'DrainageSystem',
  drainageSystemSchema
);
