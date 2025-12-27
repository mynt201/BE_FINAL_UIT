const { z } = require('zod');

// Auth validation schemas using Zod
const registerSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string()
      .email('Please provide a valid email')
      .toLowerCase(),
    password: z.string()
      .min(6, 'Password must be at least 6 characters long'),
    fullName: z.string()
      .max(100, 'Full name cannot exceed 100 characters')
      .optional(),
    phone: z.string()
      .regex(/^[0-9+\-\s()]+$/, 'Please provide a valid phone number')
      .optional()
      .or(z.literal('')),
    address: z.string()
      .max(500, 'Address cannot exceed 500 characters')
      .optional()
      .or(z.literal('')),
    role: z.enum(['user', 'admin'])
      .default('user')
      .optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    username: z.string()
      .min(1, 'Username or email is required'),
    password: z.string()
      .min(1, 'Password is required')
  })
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string()
      .min(1, 'Refresh token is required')
  })
});

// Validation middleware
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  validate
};
