import { Document, Model } from 'mongoose';
import { IRiskIndex } from '../types';
interface IRiskIndexDocument extends Omit<IRiskIndex, '_id'>, Document {
    calculateTrend(): Promise<IRiskIndexDocument>;
}
interface IRiskIndexModel extends Model<IRiskIndexDocument> {
    getLatestByWard(wardId: string, period?: string): Promise<IRiskIndexDocument | null>;
    getRiskDistribution(startDate: Date, endDate: Date, period?: string): Promise<any[]>;
    getRiskTrends(wardId: string, startDate: Date, endDate: Date, period: string): Promise<any[]>;
}
declare const _default: IRiskIndexModel;
export default _default;
//# sourceMappingURL=RiskIndex.d.ts.map