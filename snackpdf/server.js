/**
 * SnackPDF Frontend Server
 * Serves static HTML files with proper routing and SEO
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://www.googletagmanager.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://cl4pdf-api-5ad2fef3254f.herokuapp.com", "https://www.google-analytics.com"]
        }
    }
}));

// Enable compression
app.use(compression());

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(__dirname, {
    maxAge: '1d', // Cache static files for 1 day
    etag: true
}));

// Custom routing for clean URLs (remove .html extension)
const routes = [
    'merge-pdf', 'split-pdf', 'compress-pdf', 'pdf-to-word', 'word-to-pdf',
    'edit-pdf', 'sign-pdf', 'protect-pdf', 'organize-pdf', 'pdf-to-jpg',
    'jpg-to-pdf', 'excel-to-pdf', 'pdf-to-excel', 'powerpoint-to-pdf',
    'pdf-to-powerpoint', 'ocr-pdf', 'convert-pdf', 'pricing', 'features',
    'about', 'contact', 'help', 'faq', 'login', 'signup', 'privacy',
    'terms', 'blog', 'about-us', 'contact-us', 'help-center', 'support',
    'company', 'privacy-policy', 'terms-of-service'
];

// Set up routes for clean URLs
routes.forEach(route => {
    app.get(`/${route}`, (req, res) => {
        res.sendFile(path.join(__dirname, `${route}.html`));
    });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404s with a custom page
app.get('*', (req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Page Not Found | SnackPDF</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { background-color: #f8f9fa; }
                .error-container { min-height: 100vh; display: flex; align-items: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="row justify-content-center error-container">
                    <div class="col-md-6 text-center">
                        <h1 class="display-1 text-primary">404</h1>
                        <h2>Page Not Found</h2>
                        <p class="lead">The page you're looking for doesn't exist.</p>
                        <a href="/" class="btn btn-primary">Go Home</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'snackpdf-frontend',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`SnackPDF Frontend Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`URL: http://localhost:${PORT}`);
});

module.exports = app;
