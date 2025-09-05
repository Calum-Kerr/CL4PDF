/**
 * Deployment Test Script
 * Tests all API endpoints after database setup
 */

const axios = require('axios');

const API_URL = 'https://cl4pdf-api-5ad2fef3254f.herokuapp.com';

const tests = [
    {
        name: 'Health Check',
        method: 'GET',
        url: '/health',
        expectedStatus: 200
    },
    {
        name: 'Template Categories',
        method: 'GET',
        url: '/api/templates/categories',
        expectedStatus: 200
    },
    {
        name: 'Subscription Plans',
        method: 'GET',
        url: '/api/subscriptions/plans',
        expectedStatus: 200
    },
    {
        name: 'User Registration (Test)',
        method: 'POST',
        url: '/api/auth/register',
        data: {
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            full_name: 'Test User',
            platform: 'snackpdf'
        },
        expectedStatus: 201
    }
];

async function runTests() {
    console.log('🧪 Testing CL4PDF API Deployment...\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}`);
            
            const config = {
                method: test.method,
                url: `${API_URL}${test.url}`,
                timeout: 10000
            };
            
            if (test.data) {
                config.data = test.data;
            }
            
            const response = await axios(config);
            
            if (response.status === test.expectedStatus) {
                console.log(`✅ PASS - Status: ${response.status}`);
                passed++;
            } else {
                console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${response.status}`);
                failed++;
            }
            
        } catch (error) {
            console.log(`❌ FAIL - Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data: ${JSON.stringify(error.response.data)}`);
            }
            failed++;
        }
        
        console.log('');
    }
    
    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! Deployment is successful!');
    } else {
        console.log('\n⚠️  Some tests failed. Check the database setup and configuration.');
    }
}

// Run tests
runTests().catch(console.error);
