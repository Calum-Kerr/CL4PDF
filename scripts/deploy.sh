#!/bin/bash

# =====================================================
# CL4PDF Deployment Script
# =====================================================

set -e  # Exit on any error

echo "🚀 Starting CL4PDF deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "STRIPE_SECRET_KEY"
        "JWT_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    print_success "All required environment variables are set"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install API dependencies
    cd api
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    cd api
    if npm test; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
    cd ..
}

# Build application
build_app() {
    print_status "Building application..."
    
    # Build API
    cd api
    npm run build
    cd ..
    
    print_success "Application built successfully"
}

# Deploy to Heroku
deploy_heroku() {
    print_status "Deploying to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed"
        exit 1
    fi
    
    # Check if logged in to Heroku
    if ! heroku auth:whoami &> /dev/null; then
        print_error "Not logged in to Heroku. Run 'heroku login' first"
        exit 1
    fi
    
    # Add and commit changes
    git add .
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || true
    
    # Push to Heroku
    git push heroku main
    
    print_success "Deployed to Heroku successfully"
}

# Update database schema
update_database() {
    print_status "Updating database schema..."
    
    # Apply Supabase migrations
    if command -v supabase &> /dev/null; then
        supabase db push
        print_success "Database schema updated"
    else
        print_warning "Supabase CLI not found, skipping database update"
    fi
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Check API health endpoint
    if curl -f -s "https://cl4pdf-api.herokuapp.com/health" > /dev/null; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        exit 1
    fi
}

# Main deployment flow
main() {
    print_status "Starting deployment process..."
    
    # Check environment
    check_env_vars
    
    # Install dependencies
    install_dependencies
    
    # Run tests (skip in CI if needed)
    if [ "$SKIP_TESTS" != "true" ]; then
        run_tests
    fi
    
    # Build application
    build_app
    
    # Update database
    update_database
    
    # Deploy to Heroku
    deploy_heroku
    
    # Health check
    health_check
    
    print_success "🎉 Deployment completed successfully!"
    print_status "API URL: https://cl4pdf-api.herokuapp.com"
    print_status "SnackPDF: https://snackpdf.com"
    print_status "RevisePDF: https://revisepdf.com"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "test")
        check_env_vars
        install_dependencies
        run_tests
        ;;
    "build")
        install_dependencies
        build_app
        ;;
    "db")
        update_database
        ;;
    "health")
        health_check
        ;;
    *)
        echo "Usage: $0 [deploy|test|build|db|health]"
        echo "  deploy  - Full deployment (default)"
        echo "  test    - Run tests only"
        echo "  build   - Build application only"
        echo "  db      - Update database only"
        echo "  health  - Health check only"
        exit 1
        ;;
esac
