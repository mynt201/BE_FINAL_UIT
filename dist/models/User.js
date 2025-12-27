"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [50, 'Username cannot exceed 50 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    fullName: {
        type: String,
        maxlength: [100, 'Full name cannot exceed 100 characters'],
        trim: true,
    },
    phone: {
        type: String,
        match: [/^[0-9+\-\s()]+$/, 'Please add a valid phone number'],
    },
    address: {
        type: String,
        maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    avatar: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
    refreshTokens: [
        {
            token: String,
            createdAt: {
                type: Date,
                default: Date.now,
            },
            expiresAt: Date,
        },
    ],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.virtual('displayName').get(function () {
    return this.fullName || this.username;
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.methods.getSignedJwtToken = function () {
    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const expiresIn = process.env.JWT_EXPIRE || '24h';
    return jwt.sign({ id: this._id }, secret, { expiresIn });
};
userSchema.methods.generateRefreshToken = function () {
    const secret = process.env.JWT_REFRESH_SECRET ||
        process.env.JWT_SECRET ||
        'fallback-secret-change-in-production';
    const expiresIn = process.env.JWT_REFRESH_EXPIRE || '7d';
    const refreshToken = jwt.sign({ id: this._id }, secret, { expiresIn });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    this.refreshTokens.push({
        token: refreshToken,
        expiresAt,
    });
    return refreshToken;
};
userSchema.methods.cleanExpiredTokens = function () {
    if (this.refreshTokens) {
        this.refreshTokens = this.refreshTokens.filter((token) => token.expiresAt > new Date());
    }
};
userSchema.statics.findByCredentials = async function (identifier, password) {
    const user = await this.findOne({
        $or: [{ username: identifier }, { email: identifier }],
        isActive: true,
    }).select('+password');
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }
    return user;
};
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.refreshTokens;
    return userObject;
};
exports.default = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map