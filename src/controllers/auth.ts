import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import User from '../models/User';
import { logger } from '../utils/logger';
import {
  IRegisterRequest,
  ILoginRequest,
  IRefreshTokenRequest,
  IAuthResponse,
  IApiResponse,
} from '../types';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (
  req: Request<{}, IApiResponse<IAuthResponse>, IRegisterRequest>,
  res: Response<IApiResponse<IAuthResponse>>
) => {
  try {
    const { username, email, password, role, fullName, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken',
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user',
      fullName,
      phone,
      address,
    });

    // Generate tokens
    const accessToken = user.getSignedJwtToken();
    const refreshToken = user.generateRefreshToken();

    await user.save();

    // Remove sensitive data
    const userResponse = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info(`New user registered: ${username} (${email})`);

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    return;
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration',
    });
  }
  return;
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (
  req: Request<{}, IApiResponse<IAuthResponse>, ILoginRequest>,
  res: Response<IApiResponse<IAuthResponse>>
) => {
  try {
    const { username, password } = req.body;

    // Find user and check password
    const user = await User.findByCredentials(username, password);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = user.getSignedJwtToken();
    const refreshToken = user.generateRefreshToken();

    // Clean expired tokens
    user.cleanExpiredTokens();
    await user.save();

    // Remove sensitive data
    const userResponse = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info(`User logged in: ${user.username}`);

    res.json({
      success: true,
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    return;
    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid credentials',
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
    );

    // Find user and check if refresh token exists
    const decodedPayload = decoded as jwt.JwtPayload;
    const user = await User.findById(decodedPayload.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if refresh token exists and not expired
    const tokenExists =
      user.refreshTokens?.some(
        (token) => token.token === refreshToken && token.expiresAt > new Date()
      ) || false;

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Generate new access token
    const accessToken = user.getSignedJwtToken();

    // Clean expired tokens
    user.cleanExpiredTokens();
    await user.save();

    logger.info(`Token refreshed for user: ${user.username}`);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    });
    return;
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // Remove refresh token from user
    if (refreshToken && req.user) {
      const userDoc = req.user as any; // Cast to access document methods
      userDoc.refreshTokens =
        userDoc.refreshTokens?.filter((token: any) => token.token !== refreshToken) || [];
      await userDoc.save();
    }

    logger.info(`User logged out: ${req.user?.username || 'unknown'}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return;
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req: Request, res: Response) => {
  try {
    // Safeguard: ensure req.user exists and has a valid id/_id
    const userDoc = req.user as any;
    const userId = userDoc?.id || userDoc?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Exclude sensitive fields
    const user = await User.findById(userId).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Return user data without sensitive information
    const userResponse = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    return;
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

export { register, login, refreshToken, logout, getMe };
