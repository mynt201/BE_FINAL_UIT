import { Document, Model } from 'mongoose';
import { ISystemUsage } from '../types';
interface ISystemUsageDocument extends Omit<ISystemUsage, '_id'>, Document {
    getDuration(): number;
}
interface ISystemUsageModel extends Model<ISystemUsageDocument> {
    getUserActivity(userId: string, startDate: Date, endDate: Date): Promise<ISystemUsageDocument[]>;
    getWardActivity(wardId: string, startDate: Date, endDate: Date): Promise<ISystemUsageDocument[]>;
    getActivityStats(startDate: Date, endDate: Date): Promise<any>;
}
declare const _default: ISystemUsageModel;
export default _default;
//# sourceMappingURL=SystemUsage.d.ts.map