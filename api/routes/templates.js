/**
 * Template Management Routes
 * Handles PDF template browsing and management for RevisePDF
 */

const express = require('express');
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
 * GET /api/templates
 * Get PDF templates with filtering and pagination
 */
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            category, 
            search, 
            popular = false,
            sort = 'created_at'
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from('pdf_templates')
            .select('*', { count: 'exact' });
        
        // Apply filters
        if (category) {
            query = query.eq('category', category);
        }
        
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
        }
        
        if (popular === 'true') {
            query = query.eq('is_popular', true);
        }
        
        // Apply sorting
        switch (sort) {
            case 'popular':
                query = query.order('download_count', { ascending: false });
                break;
            case 'name':
                query = query.order('name', { ascending: true });
                break;
            case 'newest':
                query = query.order('created_at', { ascending: false });
                break;
            default:
                query = query.order('created_at', { ascending: false });
        }
        
        // Apply pagination
        query = query.range(offset, offset + limit - 1);
        
        const { data: templates, error, count } = await query;
        
        if (error) {
            logger.error('Templates fetch error:', error);
            return res.status(500).json({
                error: 'Failed to fetch templates'
            });
        }
        
        res.json({
            templates: templates || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });
        
    } catch (error) {
        logger.error('Get templates error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/templates/categories
 * Get template categories with counts
 */
router.get('/categories', async (req, res) => {
    try {
        const { data: categories, error } = await supabase
            .from('pdf_templates')
            .select('category, subcategory')
            .order('category');
        
        if (error) {
            logger.error('Categories fetch error:', error);
            return res.status(500).json({
                error: 'Failed to fetch categories'
            });
        }
        
        // Group by category and count
        const categoryMap = {};
        categories.forEach(item => {
            if (!categoryMap[item.category]) {
                categoryMap[item.category] = {
                    name: item.category,
                    count: 0,
                    subcategories: new Set()
                };
            }
            categoryMap[item.category].count++;
            if (item.subcategory) {
                categoryMap[item.category].subcategories.add(item.subcategory);
            }
        });
        
        // Convert to array and format
        const formattedCategories = Object.values(categoryMap).map(cat => ({
            name: cat.name,
            count: cat.count,
            subcategories: Array.from(cat.subcategories)
        }));
        
        res.json({
            categories: formattedCategories
        });
        
    } catch (error) {
        logger.error('Get categories error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/templates/:id
 * Get specific template details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: template, error } = await supabase
            .from('pdf_templates')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error || !template) {
            return res.status(404).json({
                error: 'Template not found'
            });
        }
        
        // Increment download count
        await supabase
            .from('pdf_templates')
            .update({ download_count: template.download_count + 1 })
            .eq('id', id);
        
        res.json({
            template: {
                ...template,
                download_count: template.download_count + 1
            }
        });
        
    } catch (error) {
        logger.error('Get template error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/templates/:id/use
 * Use a template (track usage and return template data)
 */
router.post('/:id/use', authenticateToken(false), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        
        const { data: template, error } = await supabase
            .from('pdf_templates')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error || !template) {
            return res.status(404).json({
                error: 'Template not found'
            });
        }
        
        // Log template usage
        await supabase
            .from('audit_log')
            .insert({
                user_id: userId,
                platform: 'revisepdf',
                action: 'template_used',
                resource_type: 'pdf_template',
                resource_id: id,
                details: {
                    template_name: template.name,
                    template_category: template.category
                },
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        
        res.json({
            message: 'Template accessed successfully',
            template: {
                id: template.id,
                name: template.name,
                description: template.description,
                template_url: template.template_url,
                form_fields: template.form_fields,
                page_count: template.page_count
            }
        });
        
    } catch (error) {
        logger.error('Use template error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/templates/popular/trending
 * Get trending templates based on recent usage
 */
router.get('/popular/trending', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        // Get templates with recent high usage
        const { data: recentUsage, error: usageError } = await supabase
            .from('audit_log')
            .select('resource_id, created_at')
            .eq('action', 'template_used')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });
        
        if (usageError) {
            logger.error('Usage fetch error:', usageError);
            return res.status(500).json({
                error: 'Failed to fetch trending templates'
            });
        }
        
        // Count usage by template
        const usageCount = {};
        recentUsage.forEach(usage => {
            usageCount[usage.resource_id] = (usageCount[usage.resource_id] || 0) + 1;
        });
        
        // Get top templates by usage
        const topTemplateIds = Object.entries(usageCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([id]) => id);
        
        if (topTemplateIds.length === 0) {
            // Fallback to popular templates
            const { data: fallbackTemplates, error: fallbackError } = await supabase
                .from('pdf_templates')
                .select('*')
                .eq('is_popular', true)
                .order('download_count', { ascending: false })
                .limit(limit);
            
            return res.json({
                templates: fallbackTemplates || []
            });
        }
        
        // Get template details
        const { data: templates, error: templatesError } = await supabase
            .from('pdf_templates')
            .select('*')
            .in('id', topTemplateIds);
        
        if (templatesError) {
            logger.error('Templates fetch error:', templatesError);
            return res.status(500).json({
                error: 'Failed to fetch template details'
            });
        }
        
        // Sort by usage count
        const sortedTemplates = templates.sort((a, b) => 
            (usageCount[b.id] || 0) - (usageCount[a.id] || 0)
        );
        
        res.json({
            templates: sortedTemplates
        });
        
    } catch (error) {
        logger.error('Get trending templates error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

module.exports = router;
