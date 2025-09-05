/**
 * Webhook Routes
 * Handles webhooks from external services like Stripe
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const logger = require('../utils/logger');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        logger.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
                
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
                
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
                
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
                
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
                
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
                
            default:
                logger.info(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
        
    } catch (error) {
        logger.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session) {
    try {
        const userId = session.metadata.user_id;
        
        if (!userId) {
            logger.error('No user_id in checkout session metadata');
            return;
        }

        // Get the subscription
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Update user's subscription tier
        const tierMap = {
            [process.env.STRIPE_PRICE_PREMIUM_MONTHLY]: 'premium',
            [process.env.STRIPE_PRICE_BUSINESS_MONTHLY]: 'business'
        };
        
        const tier = tierMap[subscription.items.data[0].price.id] || 'premium';
        const usageLimit = tier === 'premium' ? -1 : -1; // -1 means unlimited
        
        await supabase
            .from('users')
            .update({
                subscription_tier: tier,
                subscription_status: 'active',
                usage_limit: usageLimit,
                stripe_customer_id: session.customer
            })
            .eq('id', userId);

        logger.info(`Checkout completed for user ${userId}, tier: ${tier}`);
        
    } catch (error) {
        logger.error('Handle checkout completed error:', error);
    }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription) {
    try {
        // Get customer to find user
        const customer = await stripe.customers.retrieve(subscription.customer);
        const userId = customer.metadata.user_id;
        
        if (!userId) {
            logger.error('No user_id in customer metadata');
            return;
        }

        // Create subscription record
        await supabase
            .from('subscriptions')
            .insert({
                user_id: userId,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer,
                stripe_price_id: subscription.items.data[0].price.id,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
                trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
            });

        logger.info(`Subscription created for user ${userId}`);
        
    } catch (error) {
        logger.error('Handle subscription created error:', error);
    }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription) {
    try {
        // Update subscription record
        await supabase
            .from('subscriptions')
            .update({
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
            })
            .eq('stripe_subscription_id', subscription.id);

        // Update user status if subscription is canceled
        if (subscription.status === 'canceled') {
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('user_id')
                .eq('stripe_subscription_id', subscription.id)
                .single();

            if (sub) {
                await supabase
                    .from('users')
                    .update({
                        subscription_tier: 'free',
                        subscription_status: 'canceled',
                        usage_limit: 10
                    })
                    .eq('id', sub.user_id);
            }
        }

        logger.info(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
        
    } catch (error) {
        logger.error('Handle subscription updated error:', error);
    }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription) {
    try {
        // Get subscription to find user
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

        if (sub) {
            // Update user to free tier
            await supabase
                .from('users')
                .update({
                    subscription_tier: 'free',
                    subscription_status: 'canceled',
                    usage_limit: 10
                })
                .eq('id', sub.user_id);

            // Update subscription record
            await supabase
                .from('subscriptions')
                .update({
                    status: 'canceled',
                    canceled_at: new Date().toISOString()
                })
                .eq('stripe_subscription_id', subscription.id);
        }

        logger.info(`Subscription deleted: ${subscription.id}`);
        
    } catch (error) {
        logger.error('Handle subscription deleted error:', error);
    }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice) {
    try {
        if (invoice.subscription) {
            // Get subscription to find user
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('user_id')
                .eq('stripe_subscription_id', invoice.subscription)
                .single();

            if (sub) {
                // Log successful payment
                await supabase
                    .from('audit_log')
                    .insert({
                        user_id: sub.user_id,
                        platform: 'both',
                        action: 'payment_succeeded',
                        resource_type: 'subscription',
                        resource_id: sub.user_id,
                        details: {
                            invoice_id: invoice.id,
                            amount: invoice.amount_paid,
                            currency: invoice.currency
                        }
                    });
            }
        }

        logger.info(`Payment succeeded for invoice: ${invoice.id}`);
        
    } catch (error) {
        logger.error('Handle payment succeeded error:', error);
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice) {
    try {
        if (invoice.subscription) {
            // Get subscription to find user
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('user_id')
                .eq('stripe_subscription_id', invoice.subscription)
                .single();

            if (sub) {
                // Update user status
                await supabase
                    .from('users')
                    .update({
                        subscription_status: 'past_due'
                    })
                    .eq('id', sub.user_id);

                // Log failed payment
                await supabase
                    .from('audit_log')
                    .insert({
                        user_id: sub.user_id,
                        platform: 'both',
                        action: 'payment_failed',
                        resource_type: 'subscription',
                        resource_id: sub.user_id,
                        details: {
                            invoice_id: invoice.id,
                            amount: invoice.amount_due,
                            currency: invoice.currency,
                            failure_reason: invoice.last_finalization_error?.message
                        }
                    });
            }
        }

        logger.warn(`Payment failed for invoice: ${invoice.id}`);
        
    } catch (error) {
        logger.error('Handle payment failed error:', error);
    }
}

module.exports = router;
