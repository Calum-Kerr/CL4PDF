/**
 * Test PDF Merge Functionality
 * Creates test PDFs and tests the merge endpoint
 */

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

// Create test PDF files
async function createTestPDF(filename, content) {
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();
    
    page.drawText(content, {
        x: 50,
        y: height - 100,
        size: 30,
        font: helveticaFont,
        color: rgb(0, 0, 0),
    });
    
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filename, pdfBytes);
    console.log(`✅ Created test PDF: ${filename}`);
}

// Test the merge endpoint
async function testMergeEndpoint() {
    try {
        console.log('🧪 Testing PDF merge endpoint...');
        
        // Create test PDFs
        await createTestPDF('test1.pdf', 'This is Test PDF #1');
        await createTestPDF('test2.pdf', 'This is Test PDF #2');
        
        // Prepare form data
        const form = new FormData();
        form.append('files', fs.createReadStream('test1.pdf'));
        form.append('files', fs.createReadStream('test2.pdf'));
        form.append('platform', 'snackpdf');
        form.append('options', JSON.stringify({ addBookmarks: false }));
        
        // Make request to merge endpoint
        const response = await axios.post('http://localhost:3002/api/pdf/merge', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': 'Bearer test-token' // We'll need to handle auth
            },
            responseType: 'arraybuffer'
        });
        
        if (response.status === 200) {
            fs.writeFileSync('merged-output.pdf', response.data);
            console.log('✅ PDF merge successful! Output saved as merged-output.pdf');
        }
        
    } catch (error) {
        console.log('❌ PDF merge test failed:', error.response?.data || error.message);
        
        // If it's an auth error, let's test without auth first
        if (error.response?.status === 401) {
            console.log('🔄 Retrying without authentication...');
            await testMergeWithoutAuth();
        }
    } finally {
        // Clean up test files
        ['test1.pdf', 'test2.pdf'].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });
    }
}

// Test merge without authentication (for guest users)
async function testMergeWithoutAuth() {
    try {
        // Create test PDFs again
        await createTestPDF('test1.pdf', 'This is Test PDF #1');
        await createTestPDF('test2.pdf', 'This is Test PDF #2');
        
        const form = new FormData();
        form.append('files', fs.createReadStream('test1.pdf'));
        form.append('files', fs.createReadStream('test2.pdf'));
        form.append('platform', 'snackpdf');
        
        const response = await axios.post('http://localhost:3002/api/pdf/merge', form, {
            headers: form.getHeaders(),
            responseType: 'arraybuffer'
        });
        
        if (response.status === 200) {
            fs.writeFileSync('merged-output.pdf', response.data);
            console.log('✅ PDF merge successful without auth! Output saved as merged-output.pdf');
        }
        
    } catch (error) {
        console.log('❌ PDF merge failed even without auth:', error.response?.data || error.message);
    } finally {
        // Clean up
        ['test1.pdf', 'test2.pdf'].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });
    }
}

// Run the test
if (require.main === module) {
    testMergeEndpoint();
}

module.exports = { testMergeEndpoint, createTestPDF };
