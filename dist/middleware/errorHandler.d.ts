import { Request, Response, NextFunction } from 'express';
interface IError {
    message: string;
    statusCode?: number;
    stack?: string;
    name?: string;
    code?: number;
    errors?: any;
}
declare const errorHandler: (err: IError, req: Request, res: Response, next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map