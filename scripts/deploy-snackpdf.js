/**
 * Deploy SnackPDF Frontend to Heroku
 * Quick deployment script for SnackPDF updates
 */

const { execSync } = require('child_process');
const path = require('path');

const main = () => {
    console.log('🚀 Deploying SnackPDF to Heroku...\n');
    
    try {
        // Commit any changes
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Update SnackPDF frontend" || echo "No changes to commit"', { stdio: 'inherit' });
        
        // Add remote if needed
        try {
            execSync('git remote add snackpdf-frontend https://git.heroku.com/snackpdf-frontend.git', { stdio: 'pipe' });
        } catch (error) {
            // Remote already exists
        }
        
        // Deploy
        console.log('📦 Pushing to Heroku...');
        execSync('git subtree push --prefix=snackpdf snackpdf-frontend main', { 
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        
        console.log('\n✅ SnackPDF deployed successfully!');
        console.log('🌐 URL: https://snackpdf-frontend-31ae65e54ecf.herokuapp.com/');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
};

main();
