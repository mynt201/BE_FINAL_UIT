import mongoose, { Document, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { IUser } from '../types';

// Interface for User Document
interface IUserDocument extends Omit<IUser, '_id'>, Document {
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
  generateRefreshToken(): string;
  cleanExpiredTokens(): void;
}

// Interface for User Model
interface IUserModel extends Model<IUserDocument> {
  findByCredentials(identifier: string, password: string): Promise<IUserDocument>;
}

const userSchema = new mongoose.Schema<IUserDocument>(
  {
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
      select: false, // Don't include password in queries by default
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
      type: String, // URL to avatar image
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's full name display
userSchema.virtual('displayName').get(function () {
  return this.fullName || this.username;
});

// Pre-save middleware to hash password
userSchema.pre<IUserDocument>('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return next();
  }

  // Hash password with cost of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password!, salt);

  next();
});

// Instance method to check password
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password!);
};

// Instance method to generate JWT token
userSchema.methods.getSignedJwtToken = function () {
  const secret: string = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
  const expiresIn: string = process.env.JWT_EXPIRE || '24h';

  return jwt.sign({ id: this._id }, secret, { expiresIn } as jwt.SignOptions);
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  const secret: string =
    process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET ||
    'fallback-secret-change-in-production';
  const expiresIn: string = process.env.JWT_REFRESH_EXPIRE || '7d';

  const refreshToken = jwt.sign({ id: this._id }, secret, { expiresIn } as jwt.SignOptions);

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  // Add to refresh tokens array
  this.refreshTokens.push({
    token: refreshToken,
    expiresAt,
  });

  return refreshToken;
};

// Instance method to remove expired refresh tokens
userSchema.methods.cleanExpiredTokens = function () {
  if (this.refreshTokens) {
    this.refreshTokens = this.refreshTokens.filter(
      (token: { expiresAt: Date }) => token.expiresAt > new Date()
    );
  }
};
userSchema.statics.findByCredentials = async function (identifier, password) {
  // Find user by username or email
  const user = await this.findOne({
    $or: [{ username: identifier }, { email: identifier }],
    isActive: true,
  }).select('+password');

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  return userObject;
};

export default mongoose.model<IUserDocument, IUserModel>('User', userSchema);
