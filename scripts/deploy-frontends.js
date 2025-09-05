/**
 * Deploy Frontend Sites to Heroku
 * Deploys both SnackPDF and RevisePDF to separate Heroku apps
 */

const { execSync } = require('child_process');
const path = require('path');

const deployFrontend = (siteName, herokuApp) => {
    console.log(`\n🚀 Deploying ${siteName} to Heroku...`);
    
    try {
        const siteFolder = siteName.toLowerCase();
        
        // Add Heroku remote if it doesn't exist
        try {
            execSync(`git remote add ${herokuApp} https://git.heroku.com/${herokuApp}.git`, { stdio: 'pipe' });
            console.log(`✅ Added Heroku remote: ${herokuApp}`);
        } catch (error) {
            // Remote probably already exists
            console.log(`ℹ️  Heroku remote ${herokuApp} already exists`);
        }
        
        // Deploy using git subtree
        console.log(`📦 Pushing ${siteFolder} folder to ${herokuApp}...`);
        const deployCommand = `git subtree push --prefix=${siteFolder} ${herokuApp} main`;
        
        execSync(deployCommand, { 
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        
        console.log(`✅ ${siteName} deployed successfully!`);
        console.log(`🌐 URL: https://${herokuApp}.herokuapp.com/`);
        
        return true;
        
    } catch (error) {
        console.error(`❌ Failed to deploy ${siteName}:`, error.message);
        return false;
    }
};

const main = () => {
    console.log('🎯 Deploying CL4PDF Frontend Sites to Heroku\n');
    
    // Ensure we're in the right directory and have committed changes
    try {
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Update frontend files for Heroku deployment" || echo "No changes to commit"', { stdio: 'inherit' });
    } catch (error) {
        console.log('ℹ️  No changes to commit');
    }
    
    // Deploy both frontends
    const snackSuccess = deployFrontend('SnackPDF', 'snackpdf-frontend');
    const reviseSuccess = deployFrontend('RevisePDF', 'revisepdf-frontend');
    
    console.log('\n📊 Deployment Summary:');
    console.log(`SnackPDF: ${snackSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`RevisePDF: ${reviseSuccess ? '✅ Success' : '❌ Failed'}`);
    
    if (snackSuccess && reviseSuccess) {
        console.log('\n🎉 Both frontend sites deployed successfully!');
        console.log('\n🌐 Live URLs:');
        console.log('- SnackPDF: https://snackpdf-frontend-31ae65e54ecf.herokuapp.com/');
        console.log('- RevisePDF: https://revisepdf-frontend-c4aefb4be369.herokuapp.com/');
        console.log('\n🔧 Next Steps:');
        console.log('1. Test both sites are working');
        console.log('2. Configure custom domains tomorrow');
        console.log('3. Set up the Supabase database');
    } else {
        console.log('\n⚠️  Some deployments failed. Check the errors above.');
    }
};

if (require.main === module) {
    main();
}

module.exports = { deployFrontend };
