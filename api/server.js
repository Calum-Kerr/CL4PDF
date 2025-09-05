/**
 * CL4PDF API Server
 * Shared backend for SnackPDF and RevisePDF platforms
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const pdfRoutes = require('./routes/pdf');
const userRoutes = require('./routes/users');
const subscriptionRoutes = require('./routes/subscriptions');
const templateRoutes = require('./routes/templates');
const webhookRoutes = require('./routes/webhooks');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Trust proxy for Heroku
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://js.stripe.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://js.stripe.com"]
        }
    }
}));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://snackpdf.com',
            'https://revisepdf.com'
        ];
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/webhooks', webhookRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'CL4PDF API',
        version: '1.0.0',
        description: 'Shared backend API for SnackPDF and RevisePDF platforms',
        endpoints: {
            auth: '/api/auth',
            pdf: '/api/pdf',
            users: '/api/users',
            subscriptions: '/api/subscriptions',
            templates: '/api/templates',
            webhooks: '/api/webhooks'
        },
        documentation: 'https://docs.cl4pdf.com/api'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`CL4PDF API server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Health check: http://localhost:${PORT}/health`);
    });
}

module.exports = app;
