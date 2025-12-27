const { z } = require('zod');

// User validation schemas using Zod
const createUserSchema = z.object({
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
      .optional()
      .or(z.literal('')),
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

const updateUserSchema = z.object({
  params: z.object({
    id: z.string().length(24, 'Invalid user ID')
  }),
  body: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    email: z.string()
      .email('Please provide a valid email')
      .toLowerCase()
      .optional(),
    password: z.string()
      .min(6, 'Password must be at least 6 characters long')
      .optional(),
    fullName: z.string()
      .max(100, 'Full name cannot exceed 100 characters')
      .optional()
      .or(z.literal('')),
    phone: z.string()
      .regex(/^[0-9+\-\s()]+$/, 'Please provide a valid phone number')
      .optional()
      .or(z.literal('')),
    address: z.string()
      .max(500, 'Address cannot exceed 500 characters')
      .optional()
      .or(z.literal('')),
    role: z.enum(['user', 'admin'])
      .optional(),
    isActive: z.boolean()
      .optional()
  })
});

const userIdSchema = z.object({
  params: z.object({
    id: z.string().length(24, 'Invalid user ID')
  })
});

const paginationSchema = z.object({
  query: z.object({
    page: z.string()
      .transform(val => parseInt(val))
      .refine(val => val >= 1, 'Page must be a positive integer')
      .optional(),
    limit: z.string()
      .transform(val => parseInt(val))
      .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
      .optional(),
    search: z.string()
      .min(1, 'Search term must not be empty')
      .max(100, 'Search term cannot exceed 100 characters')
      .optional(),
    role: z.enum(['all', 'admin', 'user'])
      .optional()
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
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  paginationSchema,
  validate
};
