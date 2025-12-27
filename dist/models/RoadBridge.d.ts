import { Document, Model } from 'mongoose';
import { IRoadBridge } from '../types';
interface IRoadBridgeDocument extends Omit<IRoadBridge, '_id'>, Document {
    getAge(): number;
    needsMaintenance(): boolean;
    calculateTrafficLoad(): number;
}
interface IRoadBridgeModel extends Model<IRoadBridgeDocument> {
    getByWard(wardId: string): Promise<IRoadBridgeDocument[]>;
    getInfrastructureStats(wardId?: string): Promise<any>;
    getMaintenanceSchedule(): Promise<IRoadBridgeDocument[]>;
}
declare const _default: IRoadBridgeModel;
export default _default;
//# sourceMappingURL=RoadBridge.d.ts.map