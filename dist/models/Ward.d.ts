import { Document, Model } from 'mongoose';
import { IWard } from '../types';
interface IWardDocument extends Omit<IWard, '_id'>, Document {
    calculatedRisk: number;
}
interface IWardModel extends Model<IWardDocument> {
    getByRiskLevel(level: string): Promise<IWardDocument[]>;
    getStatistics(): Promise<any[]>;
}
declare const _default: IWardModel;
export default _default;
//# sourceMappingURL=Ward.d.ts.map