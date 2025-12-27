const express = require('express');
const {
    register,
    login,
    refreshToken,
    logout,
    getMe
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    validate
} = require('../validators/auth');

const router = express.Router();

// Routes with Zod validation
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;