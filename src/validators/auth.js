const { body } = require('express-validator');

// Register validation
const registerSchema = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[0-9\-\s\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
];

// Login validation
const loginSchema = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Refresh token validation
const refreshTokenSchema = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    // Run validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = require('express-validator').validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  validate
};

