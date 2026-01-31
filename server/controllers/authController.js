import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Check MongoDB connection state
        const mongoose = await import('mongoose');
        if (mongoose.default.connection.readyState !== 1) {
            return res.status(503).json({
                message: 'Database connection unavailable. Please try again later.'
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            username: username || email.split('@')[0],
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration error:', error);

        // Handle specific error types
        if (error.message.includes('buffering timed out')) {
            return res.status(503).json({
                message: 'Database connection timeout. Please try again.'
            });
        }

        if (error.message.includes('ECONNREFUSED')) {
            return res.status(503).json({
                message: 'Cannot connect to database. Please check server configuration.'
            });
        }

        if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
            return res.status(503).json({
                message: 'Database network error. Please try again later.'
            });
        }

        // Generic error
        res.status(500).json({
            message: 'An error occurred during registration. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Check MongoDB connection state
        const mongoose = await import('mongoose');
        if (mongoose.default.connection.readyState !== 1) {
            return res.status(503).json({
                message: 'Database connection unavailable. Please try again later.'
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);

        // Handle specific error types
        if (error.message.includes('buffering timed out')) {
            return res.status(503).json({
                message: 'Database connection timeout. Please try again.'
            });
        }

        if (error.message.includes('ECONNREFUSED')) {
            return res.status(503).json({
                message: 'Cannot connect to database. Please check server configuration.'
            });
        }

        if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
            return res.status(503).json({
                message: 'Database network error. Please try again later.'
            });
        }

        // Generic error
        res.status(500).json({
            message: 'An error occurred during login. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { register, login, getMe };
