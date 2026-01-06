"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { username, email, password, role, fullName, phone, address } = req.body;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }
        // Create user
        const user = await User_1.default.create({
            username,
            email,
            password,
            role: role || 'user',
            fullName,
            phone,
            address
        });
        // Generate tokens
        const accessToken = user.getSignedJwtToken();
        const refreshToken = user.generateRefreshToken();
        await user.save();
        // Remove sensitive data
        user.password = undefined;
        user.refreshTokens = undefined;
        logger_1.default.info(`New user registered: ${username} (${email})`);
        res.status(201).json({
            success: true,
            data: {
                user: user,
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Register error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during registration'
        });
    }
};
exports.register = register;
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Find user and check password
        const user = await User_1.default.findByCredentials(username, password);
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
        user.password = undefined;
        user.refreshTokens = undefined;
        logger_1.default.info(`User logged in: ${user.username}`);
        res.json({
            success: true,
            data: {
                user: user,
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Login error:', error);
        res.status(401).json({
            success: false,
            error: error.message || 'Invalid credentials'
        });
    }
};
exports.login = login;
// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required'
            });
        }
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-secret');
        // Find user and check if refresh token exists
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }
        // Check if refresh token exists and not expired
        const tokenExists = user.refreshTokens?.some((token) => token.token === refreshToken && token.expiresAt > new Date()) || false;
        if (!tokenExists) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token'
            });
        }
        // Generate new access token
        const accessToken = user.getSignedJwtToken();
        // Clean expired tokens
        user.cleanExpiredTokens();
        await user.save();
        logger_1.default.info(`Token refreshed for user: ${user.username}`);
        res.json({
            success: true,
            data: {
                accessToken
            }
        });
    }
    catch (error) {
        logger_1.default.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid refresh token'
        });
    }
};
exports.refreshToken = refreshToken;
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        // Remove refresh token from user
        if (refreshToken && req.user) {
            req.user.refreshTokens = req.user.refreshTokens?.filter((token) => token.token !== refreshToken);
            await req.user.save();
        }
        logger_1.default.info(`User logged out: ${req.user.username}`);
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during logout'
        });
    }
};
exports.logout = logout;
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.id);
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        logger_1.default.error('Get me error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=auth.js.map