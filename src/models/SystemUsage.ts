import mongoose, { Document, Model } from 'mongoose';
import { ISystemUsage } from '../types';

// Interface for SystemUsage Document
interface ISystemUsageDocument extends Omit<ISystemUsage, '_id'>, Document {
  getDuration(): number;
}

// Interface for SystemUsage Model
interface ISystemUsageModel extends Model<ISystemUsageDocument> {
  getUserActivity(userId: string, startDate: Date, endDate: Date): Promise<ISystemUsageDocument[]>;
  getWardActivity(wardId: string, startDate: Date, endDate: Date): Promise<ISystemUsageDocument[]>;
  getActivityStats(startDate: Date, endDate: Date): Promise<any>;
}

const systemUsageSchema = new mongoose.Schema<ISystemUsageDocument>(
  {
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
      type: mongoose.Schema.Types.Mixed, // Flexible object for action-specific data
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
      type: Number, // Duration in milliseconds
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
      type: String, // ID of the affected resource
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
systemUsageSchema.index({ user_id: 1, start_time: -1 });
systemUsageSchema.index({ ward_id: 1, start_time: -1 });
systemUsageSchema.index({ action: 1, start_time: -1 });
systemUsageSchema.index({ session_id: 1 });
systemUsageSchema.index({ start_time: -1, end_time: -1 });

// Virtual for formatted duration
systemUsageSchema.virtual('formattedDuration').get(function () {
  if (!this.duration_ms) return 'N/A';

  const seconds = Math.floor(this.duration_ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
});

// Instance method to calculate duration
systemUsageSchema.methods.getDuration = function () {
  if (this.end_time && this.start_time) {
    return this.end_time.getTime() - this.start_time.getTime();
  }
  return 0;
};

// Pre-save middleware to calculate duration
systemUsageSchema.pre<ISystemUsageDocument>('save', function (next) {
  if (this.end_time && this.start_time) {
    this.duration_ms = this.end_time.getTime() - this.start_time.getTime();
  }
  next();
});

// Static method to get user activity
systemUsageSchema.statics.getUserActivity = function (
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    user_id: userId,
    start_time: { $gte: startDate, $lte: endDate },
  }).sort({ start_time: -1 });
};

// Static method to get ward activity
systemUsageSchema.statics.getWardActivity = function (
  wardId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    ward_id: wardId,
    start_time: { $gte: startDate, $lte: endDate },
  }).sort({ start_time: -1 });
};

// Static method to get activity statistics
systemUsageSchema.statics.getActivityStats = async function (
  startDate: Date,
  endDate: Date
) {
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

export default mongoose.model<ISystemUsageDocument, ISystemUsageModel>(
  'SystemUsage',
  systemUsageSchema
);
