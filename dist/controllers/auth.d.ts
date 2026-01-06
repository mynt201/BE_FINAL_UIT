import { Request, Response } from 'express';
import { IRegisterRequest, ILoginRequest, IRefreshTokenRequest, IAuthResponse, IApiResponse } from '../types';
declare const register: (req: Request<{}, IApiResponse<IAuthResponse>, IRegisterRequest>, res: Response<IApiResponse<IAuthResponse>>) => Promise<Response<IApiResponse<IAuthResponse>, Record<string, any>> | undefined>;
declare const login: (req: Request<{}, IApiResponse<IAuthResponse>, ILoginRequest>, res: Response<IApiResponse<IAuthResponse>>) => Promise<void>;
declare const refreshToken: (req: Request<{}, IApiResponse<{
    accessToken: string;
}>, IRefreshTokenRequest>, res: Response<IApiResponse<{
    accessToken: string;
}>>) => Promise<Response<IApiResponse<{
    accessToken: string;
}>, Record<string, any>> | undefined>;
declare const logout: (req: Request, res: Response<IApiResponse>) => Promise<void>;
declare const getMe: (req: Request, res: Response<IApiResponse>) => Promise<void>;
export { register, login, refreshToken, logout, getMe };
//# sourceMappingURL=auth.d.ts.map