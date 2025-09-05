/**
 * Authentication Middleware
 * Handles JWT token verification, user authentication, and usage limits
 */

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware to authenticate JWT tokens
 * Can be used for both required and optional authentication
 */
const authenticateToken = (required = false) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

            if (!token) {
                if (required) {
                    return res.status(401).json({
                        error: 'Access token required'
                    });
                }
                // For optional auth, continue without user
                req.user = null;
                return next();
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if session is still active
            const { data: session, error: sessionError } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('session_token', token)
                .eq('is_active', true)
                .single();

            if (sessionError || !session) {
                return res.status(401).json({
                    error: 'Invalid or expired session'
                });
            }

            // Check if session has expired
            if (new Date(session.expires_at) < new Date()) {
                // Mark session as inactive
                await supabase
                    .from('user_sessions')
                    .update({ is_active: false })
                    .eq('id', session.id);

                return res.status(401).json({
                    error: 'Session expired'
                });
            }

            // Get user profile
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', decoded.userId)
                .single();

            if (userError || !user) {
                return res.status(401).json({
                    error: 'User not found'
                });
            }

            // Check if user account is active
            if (!user.is_active) {
                return res.status(403).json({
                    error: 'Account is deactivated'
                });
            }

            // Attach user to request
            req.user = {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                subscription_tier: user.subscription_tier,
                subscription_status: user.subscription_status,
                usage_count: user.usage_count,
                usage_limit: user.usage_limit
            };

            req.session = session;
            next();

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Invalid token'
                });
            }
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired'
                });
            }

            logger.error('Authentication error:', error);
            res.status(500).json({
                error: 'Authentication failed'
            });
        }
    };
};

/**
 * Middleware to check usage limits
 * Prevents users from exceeding their plan limits
 */
const checkUsageLimit = async (req, res, next) => {
    try {
        // Skip usage check for premium users
        if (req.user && req.user.subscription_tier !== 'free') {
            return next();
        }

        // For free users or guests, check usage limits
        if (req.user) {
            // Check user's usage count
            if (req.user.usage_count >= req.user.usage_limit) {
                return res.status(429).json({
                    error: 'Usage limit exceeded',
                    message: 'You have reached your monthly usage limit. Please upgrade to continue.',
                    current_usage: req.user.usage_count,
                    usage_limit: req.user.usage_limit,
                    upgrade_url: '/pricing'
                });
            }
        } else {
            // For guests, implement IP-based rate limiting
            const clientIp = req.ip;
            const today = new Date().toISOString().split('T')[0];
            
            // Check guest usage from audit log
            const { data: guestUsage, error } = await supabase
                .from('audit_log')
                .select('id')
                .is('user_id', null)
                .eq('ip_address', clientIp)
                .gte('created_at', `${today}T00:00:00.000Z`)
                .lt('created_at', `${today}T23:59:59.999Z`);

            if (error) {
                logger.error('Guest usage check error:', error);
                // Continue on error to not block legitimate users
                return next();
            }

            const guestLimit = 3; // 3 operations per day for guests
            if (guestUsage && guestUsage.length >= guestLimit) {
                return res.status(429).json({
                    error: 'Daily limit exceeded',
                    message: 'You have reached the daily limit for guest users. Please sign up for a free account to continue.',
                    signup_url: '/signup'
                });
            }
        }

        next();

    } catch (error) {
        logger.error('Usage limit check error:', error);
        // Continue on error to not block legitimate users
        next();
    }
};

/**
 * Middleware to require premium subscription
 */
const requirePremium = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    const premiumTiers = ['premium', 'business', 'enterprise'];
    if (!premiumTiers.includes(req.user.subscription_tier)) {
        return res.status(403).json({
            error: 'Premium subscription required',
            message: 'This feature requires a premium subscription.',
            current_tier: req.user.subscription_tier,
            upgrade_url: '/pricing'
        });
    }

    next();
};

/**
 * Middleware to require business subscription or higher
 */
const requireBusiness = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    const businessTiers = ['business', 'enterprise'];
    if (!businessTiers.includes(req.user.subscription_tier)) {
        return res.status(403).json({
            error: 'Business subscription required',
            message: 'This feature requires a business subscription or higher.',
            current_tier: req.user.subscription_tier,
            upgrade_url: '/pricing'
        });
    }

    next();
};

/**
 * Middleware to check if user owns a resource
 */
const checkResourceOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required'
                });
            }

            const resourceId = req.params.id || req.params.resourceId;
            if (!resourceId) {
                return res.status(400).json({
                    error: 'Resource ID required'
                });
            }

            let tableName;
            switch (resourceType) {
                case 'pdf_job':
                    tableName = 'pdf_jobs';
                    break;
                case 'document':
                    tableName = 'user_documents';
                    break;
                case 'template':
                    tableName = 'pdf_templates';
                    break;
                default:
                    return res.status(400).json({
                        error: 'Invalid resource type'
                    });
            }

            const { data: resource, error } = await supabase
                .from(tableName)
                .select('user_id')
                .eq('id', resourceId)
                .single();

            if (error || !resource) {
                return res.status(404).json({
                    error: 'Resource not found'
                });
            }

            if (resource.user_id !== req.user.id) {
                return res.status(403).json({
                    error: 'Access denied'
                });
            }

            next();

        } catch (error) {
            logger.error('Resource ownership check error:', error);
            res.status(500).json({
                error: 'Failed to verify resource ownership'
            });
        }
    };
};

/**
 * Middleware to validate platform parameter
 */
const validatePlatform = (req, res, next) => {
    const { platform } = req.body;
    const validPlatforms = ['snackpdf', 'revisepdf'];
    
    if (platform && !validPlatforms.includes(platform)) {
        return res.status(400).json({
            error: 'Invalid platform',
            valid_platforms: validPlatforms
        });
    }
    
    next();
};

module.exports = {
    authenticateToken,
    checkUsageLimit,
    requirePremium,
    requireBusiness,
    checkResourceOwnership,
    validatePlatform
};
