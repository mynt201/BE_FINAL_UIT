import { Document, Model } from 'mongoose';
import { IUser } from '../types';
interface IUserDocument extends Omit<IUser, '_id'>, Document {
    matchPassword(enteredPassword: string): Promise<boolean>;
    getSignedJwtToken(): string;
    generateRefreshToken(): string;
    cleanExpiredTokens(): void;
}
interface IUserModel extends Model<IUserDocument> {
    findByCredentials(identifier: string, password: string): Promise<IUserDocument>;
}
declare const _default: IUserModel;
export default _default;
//# sourceMappingURL=User.d.ts.map