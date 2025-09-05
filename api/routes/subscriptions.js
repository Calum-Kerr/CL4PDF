/**
 * Subscription Management Routes
 * Handles Stripe subscription creation, updates, and management
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
 * GET /api/subscriptions/plans
 * Get available subscription plans
 */
router.get('/plans', async (req, res) => {
    try {
        const plans = [
            {
                id: 'free',
                name: 'Free',
                price: 0,
                currency: 'usd',
                interval: 'month',
                features: [
                    '10 operations per month',
                    'Basic PDF tools',
                    'File size limit: 25MB',
                    'Email support'
                ],
                limits: {
                    operations: 10,
                    file_size: 25 * 1024 * 1024,
                    storage: 0
                }
            },
            {
                id: 'premium',
                name: 'Premium',
                price: 4.99,
                currency: 'usd',
                interval: 'month',
                stripe_price_id: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
                features: [
                    'Unlimited operations',
                    'All PDF tools',
                    'File size limit: 100MB',
                    'No watermarks',
                    'Priority support'
                ],
                limits: {
                    operations: -1, // unlimited
                    file_size: 100 * 1024 * 1024,
                    storage: 1024 * 1024 * 1024 // 1GB
                }
            },
            {
                id: 'business',
                name: 'Business',
                price: 9.99,
                currency: 'usd',
                interval: 'month',
                stripe_price_id: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
                features: [
                    'Everything in Premium',
                    'Team collaboration',
                    'API access',
                    'File size limit: 500MB',
                    'Advanced analytics',
                    'Dedicated support'
                ],
                limits: {
                    operations: -1,
                    file_size: 500 * 1024 * 1024,
                    storage: 10 * 1024 * 1024 * 1024 // 10GB
                }
            }
        ];

        res.json({ plans });

    } catch (error) {
        logger.error('Get plans error:', error);
        res.status(500).json({
            error: 'Failed to fetch subscription plans'
        });
    }
});

/**
 * POST /api/subscriptions/create-checkout-session
 * Create Stripe checkout session
 */
router.post('/create-checkout-session', authenticateToken(true), async (req, res) => {
    try {
        const { price_id, success_url, cancel_url } = req.body;

        if (!price_id) {
            return res.status(400).json({
                error: 'Price ID is required'
            });
        }

        // Get or create Stripe customer
        let customerId = req.user.stripe_customer_id;
        
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: req.user.email,
                name: req.user.full_name,
                metadata: {
                    user_id: req.user.id
                }
            });
            
            customerId = customer.id;
            
            // Update user with Stripe customer ID
            await supabase
                .from('users')
                .update({ stripe_customer_id: customerId })
                .eq('id', req.user.id);
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: price_id,
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: success_url || `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancel_url || `${req.headers.origin}/pricing`,
            metadata: {
                user_id: req.user.id
            }
        });

        res.json({
            checkout_url: session.url,
            session_id: session.id
        });

    } catch (error) {
        logger.error('Create checkout session error:', error);
        res.status(500).json({
            error: 'Failed to create checkout session'
        });
    }
});

/**
 * GET /api/subscriptions/current
 * Get current user subscription
 */
router.get('/current', authenticateToken(true), async (req, res) => {
    try {
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('status', 'active')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            logger.error('Subscription fetch error:', error);
            return res.status(500).json({
                error: 'Failed to fetch subscription'
            });
        }

        if (!subscription) {
            return res.json({
                subscription: null,
                plan: 'free'
            });
        }

        // Get Stripe subscription details
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);

        res.json({
            subscription: {
                id: subscription.id,
                status: subscription.status,
                current_period_start: subscription.current_period_start,
                current_period_end: subscription.current_period_end,
                cancel_at_period_end: subscription.cancel_at_period_end,
                trial_end: subscription.trial_end
            },
            stripe_subscription: stripeSubscription,
            plan: req.user.subscription_tier
        });

    } catch (error) {
        logger.error('Get current subscription error:', error);
        res.status(500).json({
            error: 'Failed to fetch current subscription'
        });
    }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel current subscription
 */
router.post('/cancel', authenticateToken(true), async (req, res) => {
    try {
        const { immediate = false } = req.body;

        // Get current subscription
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('status', 'active')
            .single();

        if (error || !subscription) {
            return res.status(404).json({
                error: 'No active subscription found'
            });
        }

        // Cancel in Stripe
        if (immediate) {
            await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        } else {
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                cancel_at_period_end: true
            });
        }

        // Update in database
        await supabase
            .from('subscriptions')
            .update({
                cancel_at_period_end: !immediate,
                canceled_at: immediate ? new Date().toISOString() : null,
                status: immediate ? 'canceled' : 'active'
            })
            .eq('id', subscription.id);

        // Update user tier if immediate cancellation
        if (immediate) {
            await supabase
                .from('users')
                .update({
                    subscription_tier: 'free',
                    subscription_status: 'canceled',
                    usage_limit: 10
                })
                .eq('id', req.user.id);
        }

        res.json({
            message: immediate ? 'Subscription canceled immediately' : 'Subscription will cancel at period end',
            canceled_immediately: immediate
        });

    } catch (error) {
        logger.error('Cancel subscription error:', error);
        res.status(500).json({
            error: 'Failed to cancel subscription'
        });
    }
});

/**
 * POST /api/subscriptions/reactivate
 * Reactivate a canceled subscription
 */
router.post('/reactivate', authenticateToken(true), async (req, res) => {
    try {
        // Get current subscription
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (error || !subscription) {
            return res.status(404).json({
                error: 'No subscription found'
            });
        }

        if (!subscription.cancel_at_period_end) {
            return res.status(400).json({
                error: 'Subscription is not set to cancel'
            });
        }

        // Reactivate in Stripe
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: false
        });

        // Update in database
        await supabase
            .from('subscriptions')
            .update({
                cancel_at_period_end: false,
                canceled_at: null
            })
            .eq('id', subscription.id);

        res.json({
            message: 'Subscription reactivated successfully'
        });

    } catch (error) {
        logger.error('Reactivate subscription error:', error);
        res.status(500).json({
            error: 'Failed to reactivate subscription'
        });
    }
});

/**
 * GET /api/subscriptions/billing-portal
 * Create Stripe billing portal session
 */
router.get('/billing-portal', authenticateToken(true), async (req, res) => {
    try {
        if (!req.user.stripe_customer_id) {
            return res.status(400).json({
                error: 'No billing account found'
            });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: req.user.stripe_customer_id,
            return_url: `${req.headers.origin}/account`
        });

        res.json({
            portal_url: session.url
        });

    } catch (error) {
        logger.error('Billing portal error:', error);
        res.status(500).json({
            error: 'Failed to create billing portal session'
        });
    }
});

module.exports = router;
