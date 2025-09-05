/**
 * Footer Fix Script
 * Updates all HTML files to have consistent footers with correct LinkedIn link
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Correct footer HTML with LinkedIn link
const getCorrectFooter = (siteName) => {
    return `    <!-- Footer -->
    <footer class="footer bg-dark text-light py-5">
        <div class="container">
            <div class="row">
                <div class="col-md-3 mb-4">
                    <h5>${siteName}</h5>
                    <p>Your complete PDF toolkit. Free, fast, and secure.</p>
                </div>
                <div class="col-md-3 mb-4">
                    <h6>Tools</h6>
                    <ul class="list-unstyled">
                        <li><a href="/merge-pdf" class="text-light">Merge PDF</a></li>
                        <li><a href="/split-pdf" class="text-light">Split PDF</a></li>
                        <li><a href="/compress-pdf" class="text-light">Compress PDF</a></li>
                        <li><a href="/convert-pdf" class="text-light">Convert PDF</a></li>
                    </ul>
                </div>
                <div class="col-md-3 mb-4">
                    <h6>Company</h6>
                    <ul class="list-unstyled">
                        <li><a href="/about" class="text-light">About Us</a></li>
                        <li><a href="/privacy" class="text-light">Privacy Policy</a></li>
                        <li><a href="/terms" class="text-light">Terms of Service</a></li>
                        <li><a href="/contact" class="text-light">Contact</a></li>
                    </ul>
                </div>
                <div class="col-md-3 mb-4">
                    <h6>Support</h6>
                    <ul class="list-unstyled">
                        <li><a href="/help" class="text-light">Help Center</a></li>
                        <li><a href="/faq" class="text-light">FAQ</a></li>
                        <li><a href="/blog" class="text-light">Blog</a></li>
                    </ul>
                </div>
            </div>
            <hr class="my-4">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <p class="mb-0">&copy; 2025 ${siteName}. All rights reserved.</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <a href="https://www.linkedin.com/in/calum-x-kerr" class="text-light" target="_blank" rel="noopener noreferrer">
                        <i class="bi bi-linkedin"></i> Connect on LinkedIn
                    </a>
                </div>
            </div>
        </div>
    </footer>`;
};

// Function to fix footer in a single file
const fixFooterInFile = (filePath) => {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Determine site name from file path
        const siteName = filePath.includes('snackpdf') ? 'SnackPDF' : 'RevisePDF';
        
        // Find and replace footer section
        const footerRegex = /<!-- Footer -->\s*<footer[\s\S]*?<\/footer>/;
        const correctFooter = getCorrectFooter(siteName);
        
        if (footerRegex.test(content)) {
            content = content.replace(footerRegex, correctFooter);
            fs.writeFileSync(filePath, content);
            return true;
        } else {
            console.log(`⚠️  No footer found in: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
};

// Main function to fix all footers
const fixAllFooters = () => {
    console.log('🔧 Starting footer fix...');
    
    // Find all HTML files in both directories
    const rootDir = path.join(__dirname, '..');
    const snackpdfFiles = glob.sync('snackpdf/**/*.html', { cwd: rootDir }).map(f => path.join(rootDir, f));
    const revisepdfFiles = glob.sync('revisepdf/**/*.html', { cwd: rootDir }).map(f => path.join(rootDir, f));
    
    const allFiles = [...snackpdfFiles, ...revisepdfFiles];
    
    let fixedCount = 0;
    let totalCount = 0;
    
    allFiles.forEach(filePath => {
        totalCount++;
        const relativePath = path.relative(path.join(__dirname, '..'), filePath);
        
        if (fixFooterInFile(filePath)) {
            console.log(`✅ Fixed: ${relativePath}`);
            fixedCount++;
        } else {
            console.log(`⏭️  Skipped: ${relativePath}`);
        }
    });
    
    console.log(`\n🎉 Footer fix complete!`);
    console.log(`📊 Fixed ${fixedCount} out of ${totalCount} files`);
};

// Run the fixer
if (require.main === module) {
    fixAllFooters();
}

module.exports = { fixAllFooters };
