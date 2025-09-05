/**
 * User Management Routes
 * Handles user profile, preferences, and account management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const logger = require('../utils/logger');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/users/profile
 * Get user profile
 */
router.get('/profile', authenticateToken(true), async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) {
            logger.error('Profile fetch error:', error);
            return res.status(500).json({
                error: 'Failed to fetch user profile'
            });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
                subscription_tier: user.subscription_tier,
                subscription_status: user.subscription_status,
                usage_count: user.usage_count,
                usage_limit: user.usage_limit,
                created_at: user.created_at,
                last_login_at: user.last_login_at
            }
        });

    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', [
    authenticateToken(true),
    body('full_name').optional().trim().isLength({ min: 2, max: 100 }),
    body('avatar_url').optional().isURL()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { full_name, avatar_url } = req.body;
        const updateData = {};

        if (full_name !== undefined) updateData.full_name = full_name;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'No valid fields to update'
            });
        }

        const { data: user, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) {
            logger.error('Profile update error:', error);
            return res.status(500).json({
                error: 'Failed to update profile'
            });
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                avatar_url: user.avatar_url
            }
        });

    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/users/usage
 * Get user usage statistics
 */
router.get('/usage', authenticateToken(true), async (req, res) => {
    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('usage_count, usage_limit, subscription_tier')
            .eq('id', req.user.id)
            .single();

        if (userError) {
            logger.error('Usage fetch error:', userError);
            return res.status(500).json({
                error: 'Failed to fetch usage data'
            });
        }

        // Get usage breakdown by tool
        const { data: toolUsage, error: toolError } = await supabase
            .from('pdf_jobs')
            .select('tool_name, platform, created_at')
            .eq('user_id', req.user.id)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });

        if (toolError) {
            logger.error('Tool usage fetch error:', toolError);
        }

        // Calculate usage by tool
        const usageByTool = {};
        const usageByPlatform = {};
        
        if (toolUsage) {
            toolUsage.forEach(job => {
                usageByTool[job.tool_name] = (usageByTool[job.tool_name] || 0) + 1;
                usageByPlatform[job.platform] = (usageByPlatform[job.platform] || 0) + 1;
            });
        }

        res.json({
            usage: {
                current_usage: user.usage_count,
                usage_limit: user.usage_limit,
                subscription_tier: user.subscription_tier,
                usage_percentage: Math.round((user.usage_count / user.usage_limit) * 100),
                usage_by_tool: usageByTool,
                usage_by_platform: usageByPlatform,
                recent_jobs: toolUsage ? toolUsage.slice(0, 10) : []
            }
        });

    } catch (error) {
        logger.error('Get usage error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/users/documents
 * Get user documents (for RevisePDF)
 */
router.get('/documents', authenticateToken(true), async (req, res) => {
    try {
        const { page = 1, limit = 20, folder = '/' } = req.query;
        const offset = (page - 1) * limit;

        const { data: documents, error, count } = await supabase
            .from('user_documents')
            .select('*', { count: 'exact' })
            .eq('user_id', req.user.id)
            .eq('folder_path', folder)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            logger.error('Documents fetch error:', error);
            return res.status(500).json({
                error: 'Failed to fetch documents'
            });
        }

        res.json({
            documents: documents || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        logger.error('Get documents error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * DELETE /api/users/account
 * Delete user account
 */
router.delete('/account', authenticateToken(true), async (req, res) => {
    try {
        // Delete user from Supabase Auth (this will cascade to users table)
        const { error: authError } = await supabase.auth.admin.deleteUser(req.user.id);

        if (authError) {
            logger.error('Account deletion error:', authError);
            return res.status(500).json({
                error: 'Failed to delete account'
            });
        }

        // Log account deletion
        await supabase
            .from('audit_log')
            .insert({
                user_id: req.user.id,
                platform: 'both',
                action: 'account_deleted',
                resource_type: 'user',
                resource_id: req.user.id,
                details: {
                    deletion_timestamp: new Date().toISOString()
                }
            });

        res.json({
            message: 'Account deleted successfully'
        });

    } catch (error) {
        logger.error('Delete account error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

module.exports = router;
