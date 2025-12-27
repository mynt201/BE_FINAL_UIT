"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const jwt = require("jsonwebtoken");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const register = async (req, res) => {
    try {
        const { username, email, password, role, fullName, phone, address } = req.body;
        const existingUser = await User_1.default.findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: existingUser.email === email ? 'Email already registered' : 'Username already taken',
            });
        }
        const user = await User_1.default.create({
            username,
            email,
            password,
            role: role || 'user',
            fullName,
            phone,
            address,
        });
        const accessToken = user.getSignedJwtToken();
        const refreshToken = user.generateRefreshToken();
        await user.save();
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
        logger_1.logger.info(`New user registered: ${username} (${email})`);
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
    }
    catch (error) {
        return;
        logger_1.logger.error('Register error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during registration',
        });
    }
    return;
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User_1.default.findByCredentials(username, password);
        user.lastLogin = new Date();
        await user.save();
        const accessToken = user.getSignedJwtToken();
        const refreshToken = user.generateRefreshToken();
        user.cleanExpiredTokens();
        await user.save();
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
        logger_1.logger.info(`User logged in: ${user.username}`);
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
    }
    catch (error) {
        return;
        logger_1.logger.error('Login error:', error);
        res.status(401).json({
            success: false,
            error: error.message || 'Invalid credentials',
        });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required',
            });
        }
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret');
        const decodedPayload = decoded;
        const user = await User_1.default.findById(decodedPayload.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
            });
        }
        const tokenExists = user.refreshTokens?.some((token) => token.token === refreshToken && token.expiresAt > new Date()) || false;
        if (!tokenExists) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token',
            });
        }
        const accessToken = user.getSignedJwtToken();
        user.cleanExpiredTokens();
        await user.save();
        logger_1.logger.info(`Token refreshed for user: ${user.username}`);
        res.json({
            success: true,
            data: {
                accessToken,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid refresh token',
        });
        return;
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken && req.user) {
            const userDoc = req.user;
            userDoc.refreshTokens =
                userDoc.refreshTokens?.filter((token) => token.token !== refreshToken) || [];
            await userDoc.save();
        }
        logger_1.logger.info(`User logged out: ${req.user?.username || 'unknown'}`);
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        return;
        logger_1.logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during logout',
        });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        const userDoc = req.user;
        const userId = userDoc?.id || userDoc?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const user = await User_1.default.findById(userId).select('-password -refreshTokens');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
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
    }
    catch (error) {
        return;
        logger_1.logger.error('Get me error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=auth.js.map