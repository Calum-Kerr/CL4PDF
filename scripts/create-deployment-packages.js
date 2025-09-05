/**
 * Create Deployment Packages
 * Creates ZIP files for easy upload to hosting providers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const createZipPackage = (siteName) => {
    const sitePath = path.join(__dirname, '..', siteName.toLowerCase());
    const zipName = `${siteName.toLowerCase()}-deployment.zip`;
    const zipPath = path.join(__dirname, '..', zipName);
    
    console.log(`📦 Creating deployment package for ${siteName}...`);
    
    try {
        // Check if the site directory exists
        if (!fs.existsSync(sitePath)) {
            console.error(`❌ ${siteName} directory not found: ${sitePath}`);
            return false;
        }
        
        // Create ZIP file using PowerShell (Windows)
        const command = `powershell -command "Compress-Archive -Path '${sitePath}\\*' -DestinationPath '${zipPath}' -Force"`;
        execSync(command, { stdio: 'inherit' });
        
        console.log(`✅ Created: ${zipName}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Failed to create ZIP for ${siteName}:`, error.message);
        return false;
    }
};

const main = () => {
    console.log('📦 Creating deployment packages for both sites...\n');
    
    const snackSuccess = createZipPackage('SnackPDF');
    const reviseSuccess = createZipPackage('RevisePDF');
    
    console.log('\n📊 Package Creation Summary:');
    console.log(`SnackPDF: ${snackSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`RevisePDF: ${reviseSuccess ? '✅ Success' : '❌ Failed'}`);
    
    if (snackSuccess && reviseSuccess) {
        console.log('\n🎉 Both deployment packages created successfully!');
        console.log('\n📁 Files created:');
        console.log('- snackpdf-deployment.zip (for snackpdf.com)');
        console.log('- revisepdf-deployment.zip (for revisepdf.com)');
        console.log('\n🚀 Ready to upload to your hosting provider!');
    } else {
        console.log('\n⚠️  Some packages failed to create. Check the errors above.');
    }
};

if (require.main === module) {
    main();
}

module.exports = { createZipPackage };
