/**
 * Frontend Deployment Preparation Script
 * Prepares both SnackPDF and RevisePDF for static hosting deployment
 */

const fs = require('fs');
const path = require('path');

// Configuration for deployment
const config = {
    apiUrl: 'https://cl4pdf-api-5ad2fef3254f.herokuapp.com',
    snackpdfDomain: 'snackpdf.com',
    revisepdfDomain: 'revisepdf.com'
};

// Update API endpoints in JavaScript files
const updateApiEndpoints = (sitePath, siteName) => {
    console.log(`📝 Updating API endpoints for ${siteName}...`);
    
    const assetsPath = path.join(sitePath, 'assets', 'js');
    
    if (!fs.existsSync(assetsPath)) {
        fs.mkdirSync(assetsPath, { recursive: true });
    }
    
    // Create a config.js file with API endpoints
    const configJs = `/**
 * ${siteName} Configuration
 * API endpoints and configuration for production
 */

window.CL4PDF_CONFIG = {
    API_URL: '${config.apiUrl}',
    SITE_NAME: '${siteName}',
    DOMAIN: '${siteName === 'SnackPDF' ? config.snackpdfDomain : config.revisepdfDomain}',
    
    // API Endpoints
    ENDPOINTS: {
        // Authentication
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        ME: '/api/auth/me',
        
        // PDF Processing
        MERGE_PDF: '/api/pdf/merge',
        SPLIT_PDF: '/api/pdf/split',
        COMPRESS_PDF: '/api/pdf/compress',
        CONVERT_PDF: '/api/pdf/convert',
        
        // Templates (RevisePDF)
        TEMPLATES: '/api/templates',
        TEMPLATE_CATEGORIES: '/api/templates/categories',
        
        // Subscriptions
        PLANS: '/api/subscriptions/plans',
        CHECKOUT: '/api/subscriptions/create-checkout-session',
        
        // User Management
        PROFILE: '/api/users/profile',
        USAGE: '/api/users/usage'
    },
    
    // File Upload Settings
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_FILES: 10,
    ALLOWED_TYPES: ['application/pdf'],
    
    // UI Settings
    BRAND_COLOR: '#238287',
    THEME: 'light'
};

// Helper function to make API calls
window.apiCall = async (endpoint, options = {}) => {
    const url = window.CL4PDF_CONFIG.API_URL + endpoint;
    const token = localStorage.getItem('auth_token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': \`Bearer \${token}\` })
        }
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

console.log('${siteName} configuration loaded successfully');`;

    fs.writeFileSync(path.join(assetsPath, 'config.js'), configJs);
    console.log(`✅ Created config.js for ${siteName}`);
};

// Create a simple analytics script
const createAnalyticsScript = (sitePath, siteName) => {
    console.log(`📊 Creating analytics script for ${siteName}...`);
    
    const assetsPath = path.join(sitePath, 'assets', 'js');
    
    const analyticsJs = `/**
 * ${siteName} Analytics
 * Simple analytics and user tracking
 */

class Analytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = localStorage.getItem('user_id') || null;
        this.events = [];
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    track(event, properties = {}) {
        const eventData = {
            event,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                session_id: this.sessionId,
                user_id: this.userId,
                page: window.location.pathname,
                referrer: document.referrer,
                user_agent: navigator.userAgent
            }
        };
        
        this.events.push(eventData);
        
        // Send to API if available
        if (window.CL4PDF_CONFIG) {
            this.sendEvent(eventData);
        }
        
        console.log('📊 Event tracked:', event, properties);
    }
    
    async sendEvent(eventData) {
        try {
            await window.apiCall('/api/analytics/track', {
                method: 'POST',
                body: JSON.stringify(eventData)
            });
        } catch (error) {
            // Silently fail - analytics shouldn't break the app
            console.debug('Analytics event failed to send:', error);
        }
    }
    
    pageView() {
        this.track('page_view', {
            title: document.title,
            url: window.location.href
        });
    }
    
    toolUsed(toolName) {
        this.track('tool_used', {
            tool: toolName,
            platform: '${siteName.toLowerCase()}'
        });
    }
    
    fileUploaded(fileInfo) {
        this.track('file_uploaded', {
            file_size: fileInfo.size,
            file_type: fileInfo.type,
            file_name: fileInfo.name
        });
    }
    
    conversionCompleted(toolName, processingTime) {
        this.track('conversion_completed', {
            tool: toolName,
            processing_time: processingTime,
            platform: '${siteName.toLowerCase()}'
        });
    }
}

// Initialize analytics
window.analytics = new Analytics();

// Track page view on load
document.addEventListener('DOMContentLoaded', () => {
    window.analytics.pageView();
});

console.log('${siteName} analytics initialized');`;

    fs.writeFileSync(path.join(assetsPath, 'analytics.js'), analyticsJs);
    console.log(`✅ Created analytics.js for ${siteName}`);
};

// Update HTML files to include the new scripts
const updateHtmlFiles = (sitePath, siteName) => {
    console.log(`🔧 Updating HTML files for ${siteName}...`);
    
    const htmlFiles = fs.readdirSync(sitePath).filter(file => file.endsWith('.html'));
    
    htmlFiles.forEach(file => {
        const filePath = path.join(sitePath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add config.js and analytics.js before the closing body tag
        const scriptsToAdd = `    <!-- CL4PDF Configuration -->
    <script src="/assets/js/config.js"></script>
    
    <!-- Analytics -->
    <script src="/assets/js/analytics.js"></script>
    
    <!-- Google Analytics (replace with your GA4 ID) -->
    <!-- <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'GA_MEASUREMENT_ID');
    </script> -->
    
</body>`;
        
        // Replace the closing body tag
        content = content.replace('</body>', scriptsToAdd);
        
        // Update API URLs in the content if any
        content = content.replace(/localhost:3002/g, 'cl4pdf-api-5ad2fef3254f.herokuapp.com');
        
        fs.writeFileSync(filePath, content);
    });
    
    console.log(`✅ Updated ${htmlFiles.length} HTML files for ${siteName}`);
};

// Create deployment package
const createDeploymentPackage = (siteName) => {
    console.log(`\n🚀 Preparing ${siteName} for deployment...`);
    
    const sitePath = path.join(__dirname, '..', siteName.toLowerCase());
    
    if (!fs.existsSync(sitePath)) {
        console.error(`❌ ${siteName} directory not found: ${sitePath}`);
        return;
    }
    
    // Update API endpoints
    updateApiEndpoints(sitePath, siteName);
    
    // Create analytics script
    createAnalyticsScript(sitePath, siteName);
    
    // Update HTML files
    updateHtmlFiles(sitePath, siteName);
    
    console.log(`✅ ${siteName} is ready for deployment!`);
    console.log(`📁 Deploy the entire '${siteName.toLowerCase()}' folder to your static hosting`);
};

// Main execution
const main = () => {
    console.log('🎯 Preparing CL4PDF Frontend for Deployment\n');
    
    // Prepare both sites
    createDeploymentPackage('SnackPDF');
    createDeploymentPackage('RevisePDF');
    
    console.log('\n🎉 Frontend preparation complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Upload the "snackpdf" folder to your static hosting for snackpdf.com');
    console.log('2. Upload the "revisepdf" folder to your static hosting for revisepdf.com');
    console.log('3. Configure your DNS to point to the hosting provider');
    console.log('4. Set up SSL certificates for both domains');
    console.log('\n🔗 Recommended static hosting providers:');
    console.log('- Netlify (netlify.com) - Free tier available');
    console.log('- Vercel (vercel.com) - Free tier available');
    console.log('- GitHub Pages - Free for public repos');
    console.log('- AWS S3 + CloudFront - Pay as you go');
    console.log('- Cloudflare Pages - Free tier available');
};

// Run the script
if (require.main === module) {
    main();
}

module.exports = { createDeploymentPackage };
