/**
 * SnackPDF Configuration
 * API endpoints and configuration for production
 */

window.CL4PDF_CONFIG = {
    API_URL: 'http://localhost:3002',
    SITE_NAME: 'SnackPDF',
    DOMAIN: 'snackpdf.com',
    
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
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

console.log('SnackPDF configuration loaded successfully');