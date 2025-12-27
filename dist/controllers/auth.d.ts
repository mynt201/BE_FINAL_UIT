import { Request, Response } from 'express';
import { IRegisterRequest, ILoginRequest, IAuthResponse, IApiResponse } from '../types';
declare const register: (req: Request<{}, IApiResponse<IAuthResponse>, IRegisterRequest>, res: Response<IApiResponse<IAuthResponse>>) => Promise<Response<IApiResponse<IAuthResponse>, Record<string, any>> | undefined>;
declare const login: (req: Request<{}, IApiResponse<IAuthResponse>, ILoginRequest>, res: Response<IApiResponse<IAuthResponse>>) => Promise<void>;
declare const refreshToken: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const logout: (req: Request, res: Response) => Promise<void>;
declare const getMe: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export { register, login, refreshToken, logout, getMe };
//# sourceMappingURL=auth.d.ts.map