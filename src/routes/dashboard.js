const express = require('express');
const { getDashboardStats } = require('../controllers/dashboard');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/stats', getDashboardStats);

module.exports = router;