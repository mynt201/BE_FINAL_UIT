import { Document, Model } from 'mongoose';
import { IWeather } from '../types';
interface IWeatherDocument extends Omit<IWeather, '_id'>, Document {
    temperatureRange: number;
    rainSeverity: string;
}
interface IWeatherModel extends Model<IWeatherDocument> {
    getByDateRange(startDate: Date, endDate: Date, wardId?: string): Promise<IWeatherDocument[]>;
    getRainfallStats(startDate: Date, endDate: Date, wardId?: string): Promise<any[]>;
    getLatest(wardId?: string, limit?: number): Promise<IWeatherDocument[]>;
}
declare const _default: IWeatherModel;
export default _default;
//# sourceMappingURL=Weather.d.ts.map