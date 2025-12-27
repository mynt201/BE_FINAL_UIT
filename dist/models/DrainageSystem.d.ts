import { Document, Model } from 'mongoose';
import { IDrainageSystem } from '../types';
interface IDrainageSystemDocument extends Omit<IDrainageSystem, '_id'>, Document {
    getCapacityUtilization(): number;
    calculateEfficiency(): number;
}
interface IDrainageSystemModel extends Model<IDrainageSystemDocument> {
    getByWard(wardId: string): Promise<IDrainageSystemDocument[]>;
    getSystemStats(wardId?: string): Promise<any>;
}
declare const _default: IDrainageSystemModel;
export default _default;
//# sourceMappingURL=DrainageSystem.d.ts.map