/**
 * Deploy RevisePDF Frontend to Heroku
 * Quick deployment script for RevisePDF updates
 */

const { execSync } = require('child_process');
const path = require('path');

const main = () => {
    console.log('🚀 Deploying RevisePDF to Heroku...\n');
    
    try {
        // Commit any changes
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Update RevisePDF frontend" || echo "No changes to commit"', { stdio: 'inherit' });
        
        // Add remote if needed
        try {
            execSync('git remote add revisepdf-frontend https://git.heroku.com/revisepdf-frontend.git', { stdio: 'pipe' });
        } catch (error) {
            // Remote already exists
        }
        
        // Deploy
        console.log('📦 Pushing to Heroku...');
        execSync('git subtree push --prefix=revisepdf revisepdf-frontend main', { 
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        
        console.log('\n✅ RevisePDF deployed successfully!');
        console.log('🌐 URL: https://revisepdf-frontend-c4aefb4be369.herokuapp.com/');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
};

main();
