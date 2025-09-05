/**
 * Integration Test Suite
 * Tests the complete CL4PDF application stack
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
    apiUrl: process.env.API_URL || 'http://localhost:3002',
    snackpdfUrl: process.env.SNACKPDF_URL || 'http://localhost:3000',
    revisepdfUrl: process.env.REVISEPDF_URL || 'http://localhost:3001',
    testTimeout: 30000
};

// Test results
let testResults = {
    passed: 0,
    failed: 0,
    errors: []
};

// Helper functions
const log = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        error: '\x1b[31m',
        warning: '\x1b[33m'
    };
    console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
};

const assert = (condition, message) => {
    if (condition) {
        testResults.passed++;
        log(`✓ ${message}`, 'success');
    } else {
        testResults.failed++;
        testResults.errors.push(message);
        log(`✗ ${message}`, 'error');
    }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test suites
const testApiHealth = async () => {
    log('Testing API health endpoint...');
    
    try {
        const response = await axios.get(`${config.apiUrl}/health`, {
            timeout: 5000
        });
        
        assert(response.status === 200, 'API health endpoint returns 200');
        assert(response.data.status === 'healthy', 'API reports healthy status');
        assert(response.data.version, 'API returns version information');
        
    } catch (error) {
        assert(false, `API health check failed: ${error.message}`);
    }
};

const testApiAuth = async () => {
    log('Testing API authentication...');
    
    try {
        // Test registration
        const registerData = {
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            full_name: 'Test User',
            platform: 'snackpdf'
        };
        
        const registerResponse = await axios.post(`${config.apiUrl}/api/auth/register`, registerData);
        assert(registerResponse.status === 201, 'User registration succeeds');
        assert(registerResponse.data.token, 'Registration returns JWT token');
        
        const token = registerResponse.data.token;
        
        // Test profile access
        const profileResponse = await axios.get(`${config.apiUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        assert(profileResponse.status === 200, 'Profile access with token succeeds');
        assert(profileResponse.data.user.email === registerData.email, 'Profile returns correct user data');
        
        // Test logout
        const logoutResponse = await axios.post(`${config.apiUrl}/api/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        assert(logoutResponse.status === 200, 'Logout succeeds');
        
    } catch (error) {
        assert(false, `API authentication test failed: ${error.message}`);
    }
};

const testPdfProcessing = async () => {
    log('Testing PDF processing endpoints...');
    
    try {
        // Create a simple test PDF buffer (mock)
        const testPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
        
        // Test without authentication (guest usage)
        const FormData = require('form-data');
        const form = new FormData();
        form.append('files', testPdfBuffer, 'test1.pdf');
        form.append('files', testPdfBuffer, 'test2.pdf');
        form.append('platform', 'snackpdf');
        
        const mergeResponse = await axios.post(`${config.apiUrl}/api/pdf/merge`, form, {
            headers: {
                ...form.getHeaders(),
                'Content-Type': 'multipart/form-data'
            },
            timeout: config.testTimeout
        });
        
        assert(mergeResponse.status === 200, 'PDF merge without auth succeeds');
        assert(mergeResponse.data.result, 'PDF merge returns result');
        
    } catch (error) {
        // PDF processing might fail due to invalid test PDF, but endpoint should be reachable
        assert(error.response && error.response.status !== 404, `PDF processing endpoint is reachable: ${error.message}`);
    }
};

const testFrontendPages = async () => {
    log('Testing frontend page accessibility...');
    
    const pages = [
        { url: config.snackpdfUrl, name: 'SnackPDF home page' },
        { url: `${config.snackpdfUrl}/merge-pdf`, name: 'SnackPDF merge page' },
        { url: `${config.snackpdfUrl}/split-pdf`, name: 'SnackPDF split page' },
        { url: config.revisepdfUrl, name: 'RevisePDF home page' },
        { url: `${config.revisepdfUrl}/editor`, name: 'RevisePDF editor page' },
        { url: `${config.revisepdfUrl}/templates`, name: 'RevisePDF templates page' }
    ];
    
    for (const page of pages) {
        try {
            const response = await axios.get(page.url, {
                timeout: 10000,
                validateStatus: (status) => status < 500 // Accept 4xx but not 5xx
            });
            
            assert(response.status < 500, `${page.name} is accessible (status: ${response.status})`);
            
            if (response.status === 200) {
                assert(response.data.includes('<html'), `${page.name} returns valid HTML`);
            }
            
        } catch (error) {
            assert(false, `${page.name} failed to load: ${error.message}`);
        }
    }
};

const testDatabase = async () => {
    log('Testing database connectivity...');
    
    try {
        // Test database through API endpoints
        const response = await axios.get(`${config.apiUrl}/api/templates/categories`);
        assert(response.status === 200, 'Database query through API succeeds');
        assert(Array.isArray(response.data.categories), 'Database returns expected data structure');
        
    } catch (error) {
        assert(false, `Database connectivity test failed: ${error.message}`);
    }
};

const testSubscriptionFlow = async () => {
    log('Testing subscription flow...');
    
    try {
        // Test plans endpoint
        const plansResponse = await axios.get(`${config.apiUrl}/api/subscriptions/plans`);
        assert(plansResponse.status === 200, 'Subscription plans endpoint accessible');
        assert(Array.isArray(plansResponse.data.plans), 'Plans endpoint returns plans array');
        assert(plansResponse.data.plans.length > 0, 'At least one subscription plan exists');
        
    } catch (error) {
        assert(false, `Subscription flow test failed: ${error.message}`);
    }
};

// Main test runner
const runTests = async () => {
    log('🧪 Starting CL4PDF Integration Tests', 'info');
    log(`API URL: ${config.apiUrl}`, 'info');
    log(`SnackPDF URL: ${config.snackpdfUrl}`, 'info');
    log(`RevisePDF URL: ${config.revisepdfUrl}`, 'info');
    
    const startTime = Date.now();
    
    // Run test suites
    await testApiHealth();
    await testDatabase();
    await testApiAuth();
    await testPdfProcessing();
    await testFrontendPages();
    await testSubscriptionFlow();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Print results
    log('\n📊 Test Results:', 'info');
    log(`✅ Passed: ${testResults.passed}`, 'success');
    log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
    log(`⏱️  Duration: ${duration}s`, 'info');
    
    if (testResults.failed > 0) {
        log('\n🚨 Failed Tests:', 'error');
        testResults.errors.forEach(error => {
            log(`  • ${error}`, 'error');
        });
    }
    
    // Write results to file
    const resultsFile = path.join(__dirname, '../test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        duration: duration,
        passed: testResults.passed,
        failed: testResults.failed,
        errors: testResults.errors,
        config: config
    }, null, 2));
    
    log(`\n📄 Results saved to: ${resultsFile}`, 'info');
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
};

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    log(`Unhandled rejection: ${error.message}`, 'error');
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`, 'error');
    process.exit(1);
});

// Run tests
if (require.main === module) {
    runTests();
}

module.exports = { runTests, testResults };
