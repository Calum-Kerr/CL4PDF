/**
 * Authentication Routes
 * Handles user registration, login, logout, and session management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const logger = require('../utils/logger');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.'
    }
});

// Apply rate limiting to sensitive endpoints
router.use('/login', authLimiter);
router.use('/register', authLimiter);
router.use('/forgot-password', authLimiter);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('full_name').trim().isLength({ min: 2, max: 100 }),
    body('platform').isIn(['snackpdf', 'revisepdf']).optional()
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, password, full_name, platform = 'snackpdf' } = req.body;

        // Check if user already exists in our users table
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists with this email'
            });
        }

        // For now, create a simple user record without password storage
        // In production, you'd want proper password hashing and Supabase Auth

        // Generate user ID
        const { v4: uuidv4 } = require('uuid');
        const userId = uuidv4();

        // Create user directly in our database (simplified for demo)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email,
                full_name,
                subscription_tier: 'free',
                subscription_status: 'active',
                usage_count: 0,
                usage_limit: 10
            })
            .select()
            .single();

        if (userError) {
            logger.error('User creation error:', userError);
            return res.status(400).json({
                error: 'Failed to create user account',
                details: userError.message
            });
        }

        // Log user activity
        await logUserActivity(userData.id, platform, 'user_registered', 'user', userData.id, {
            registration_method: 'email',
            platform
        });

        // Generate JWT token for immediate login
        const token = jwt.sign(
            {
                userId: userData.id,
                email: userData.email,
                platform
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name,
                platform
            },
            token,
            requires_verification: false // Simplified for demo
        });

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal server error during registration'
        });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('platform').isIn(['snackpdf', 'revisepdf']).optional()
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, password, platform = 'snackpdf' } = req.body;

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            logger.warn('Login attempt failed:', { email, error: authError.message });
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            logger.error('Profile fetch error:', profileError);
            return res.status(500).json({
                error: 'Failed to fetch user profile'
            });
        }

        // Update last login
        await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', authData.user.id);

        // Create session record
        const sessionToken = jwt.sign(
            { 
                userId: authData.user.id,
                email: authData.user.email,
                platform
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { error: sessionError } = await supabase
            .from('user_sessions')
            .insert({
                user_id: authData.user.id,
                session_token: sessionToken,
                platform,
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });

        if (sessionError) {
            logger.error('Session creation error:', sessionError);
        }

        // Log user activity
        await logUserActivity(authData.user.id, platform, 'user_login', 'session', null, {
            login_method: 'email',
            platform,
            ip_address: req.ip
        });

        res.json({
            message: 'Login successful',
            user: {
                id: userProfile.id,
                email: userProfile.email,
                full_name: userProfile.full_name,
                subscription_tier: userProfile.subscription_tier,
                usage_count: userProfile.usage_count,
                usage_limit: userProfile.usage_limit
            },
            token: sessionToken,
            expires_in: '7d'
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error during login'
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            // Invalidate session in database
            await supabase
                .from('user_sessions')
                .update({ is_active: false })
                .eq('session_token', token);
        }

        res.json({
            message: 'Logout successful'
        });

    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            error: 'Internal server error during logout'
        });
    }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail(),
    body('platform').isIn(['snackpdf', 'revisepdf']).optional()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, platform = 'snackpdf' } = req.body;

        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `https://${platform}.com/reset-password`
        });

        if (error) {
            logger.error('Password reset error:', error);
            return res.status(400).json({
                error: 'Failed to send password reset email'
            });
        }

        res.json({
            message: 'Password reset email sent successfully'
        });

    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                error: 'No token provided'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user profile
        const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !userProfile) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({
            user: {
                id: userProfile.id,
                email: userProfile.email,
                full_name: userProfile.full_name,
                subscription_tier: userProfile.subscription_tier,
                subscription_status: userProfile.subscription_status,
                usage_count: userProfile.usage_count,
                usage_limit: userProfile.usage_limit,
                created_at: userProfile.created_at
            }
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token'
            });
        }
        
        logger.error('Get profile error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * Helper function to log user activity
 */
async function logUserActivity(userId, platform, action, resourceType, resourceId, details) {
    try {
        await supabase
            .from('audit_log')
            .insert({
                user_id: userId,
                platform,
                action,
                resource_type: resourceType,
                resource_id: resourceId,
                details
            });
    } catch (error) {
        logger.error('Activity logging error:', error);
    }
}

module.exports = router;
