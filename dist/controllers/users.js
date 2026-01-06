const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const role = req.query.role;

        // Build search query
        const searchQuery = {};

        if (search) {
            searchQuery.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'all') {
            searchQuery.role = role;
        }

        // Calculate pagination
        const startIndex = (page - 1) * limit;

        // Execute query
        const users = await User.find(searchQuery)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(startIndex)
            .select('-password -refreshTokens');

        // Get total count for pagination
        const total = await User.countDocuments(searchQuery);

        // Pagination info
        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        };

        res.json({
            success: true,
            data: users,
            pagination
        });
    } catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching users'
        });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -refreshTokens');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching user'
        });
    }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async(req, res) => {
    try {
        const { username, email, password, role, fullName, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
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
            address
        });

        logger.info(`User created by admin: ${user.username}`);

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while creating user'
        });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Prevent admin from modifying their own role or deleting themselves
        if (req.user.id === req.params.id && req.body.role && req.body.role !== user.role) {
            return res.status(400).json({
                success: false,
                error: 'Cannot change your own role'
            });
        }

        // Update fields
        const allowedFields = ['username', 'email', 'role', 'fullName', 'phone', 'address', 'isActive'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        // Handle password change separately
        if (req.body.password) {
            user.password = req.body.password;
        }

        await user.save();

        logger.info(`User updated: ${user.username}`);

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while updating user'
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Prevent admin from deleting themselves
        if (req.user.id === req.params.id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own account'
            });
        }

        await user.remove();

        logger.info(`User deleted: ${user.username}`);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        logger.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting user'
        });
    }
};

// @desc    Upload user avatar
// @route   POST /api/users/:id/avatar
// @access  Private
const uploadAvatar = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user can upload their own avatar or admin can upload for anyone
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to upload avatar for this user'
            });
        }

        // Create avatar URL
        const avatarUrl = `/uploads/${req.file.filename}`;

        // Update user avatar
        user.avatar = avatarUrl;
        await user.save();

        logger.info(`Avatar uploaded for user: ${user.username}`);

        res.json({
            success: true,
            data: {
                avatar: avatarUrl
            }
        });
    } catch (error) {
        logger.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while uploading avatar'
        });
    }
};

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    uploadAvatar
};