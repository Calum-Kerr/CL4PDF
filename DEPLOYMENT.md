# CL4PDF Deployment Guide

This guide covers deploying the CL4PDF platform (SnackPDF + RevisePDF) to production.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SnackPDF      │    │   RevisePDF     │    │   API Server    │
│  (Frontend)     │    │  (Frontend)     │    │   (Backend)     │
│                 │    │                 │    │                 │
│ • Static HTML   │    │ • Static HTML   │    │ • Express.js    │
│ • Bootstrap CSS │    │ • Bootstrap CSS │    │ • PDF Processing│
│ • Vanilla JS    │    │ • PDF Editor    │    │ • Authentication│
│                 │    │ • Templates     │    │ • Stripe        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Supabase      │
                    │                 │
                    │ • PostgreSQL    │
                    │ • Authentication│
                    │ • File Storage  │
                    │ • Real-time     │
                    └─────────────────┘
```

## 🚀 Quick Deploy

### Prerequisites
- Node.js 18+
- Heroku CLI
- Supabase account
- Stripe account
- Git repository

### 1. Environment Setup
```bash
# Clone repository
git clone https://github.com/Calum-Kerr/CL4PDF.git
cd CL4PDF

# Copy environment template
cp .env.template .env

# Edit .env with your production values
nano .env
```

### 2. Database Setup
```bash
# Apply database schema
supabase db push

# Verify tables created
supabase db list
```

### 3. Deploy to Heroku
```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create cl4pdf-api

# Set environment variables
heroku config:set SUPABASE_URL=your_supabase_url
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_service_key
heroku config:set STRIPE_SECRET_KEY=your_stripe_key
heroku config:set JWT_SECRET=your_jwt_secret

# Deploy
git push heroku main
```

### 4. Frontend Deployment
```bash
# Deploy SnackPDF (static hosting)
# Upload snackpdf/ folder to your CDN/static host

# Deploy RevisePDF (static hosting)  
# Upload revisepdf/ folder to your CDN/static host
```

## 🔧 Detailed Configuration

### Environment Variables

#### Required Variables
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Security
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters
SESSION_SECRET=your_session_secret_also_32_characters_minimum
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Application
NODE_ENV=production
PORT=3002
```

#### Optional Variables
```bash
# Domains
SNACKPDF_DOMAIN=snackpdf.com
REVISEPDF_DOMAIN=revisepdf.com
API_DOMAIN=api.snackpdf.com

# File Limits
MAX_FILE_SIZE=52428800  # 50MB
MAX_FILES_PER_JOB=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Features
ENABLE_REGISTRATION=true
ENABLE_GUEST_UPLOADS=true
ENABLE_PREMIUM_FEATURES=true
```

### Supabase Configuration

#### 1. Database Schema
The complete schema is in `supabase/schema.sql`. Apply it:
```sql
-- Run the complete schema file
\i supabase/schema.sql
```

#### 2. Storage Buckets
Create the required storage buckets:
```bash
# Create buckets
supabase storage create pdf-uploads
supabase storage create pdf-processed  
supabase storage create pdf-templates
supabase storage create thumbnails

# Set bucket policies (public read for processed files)
supabase storage update pdf-processed --public true
```

#### 3. Authentication Settings
Configure in Supabase Dashboard:
- Enable email authentication
- Set up email templates
- Configure redirect URLs
- Set JWT expiry (7 days recommended)

### Stripe Configuration

#### 1. Products and Prices
Create subscription products:
```bash
# Premium Plan
stripe products create --name="Premium" --description="Unlimited PDF operations"
stripe prices create --product=prod_xxx --unit-amount=499 --currency=usd --recurring[interval]=month

# Business Plan  
stripe products create --name="Business" --description="Team collaboration and API access"
stripe prices create --product=prod_yyy --unit-amount=999 --currency=usd --recurring[interval]=month
```

#### 2. Webhooks
Set up webhook endpoint: `https://your-api-domain.com/api/webhooks/stripe`

Required events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 🌐 Domain Setup

### DNS Configuration
```
# A Records
snackpdf.com        → Your CDN/Static Host IP
revisepdf.com       → Your CDN/Static Host IP
api.snackpdf.com    → Heroku App IP

# CNAME Records (alternative)
snackpdf.com        → your-cdn.cloudfront.net
revisepdf.com       → your-cdn.cloudfront.net
api.snackpdf.com    → cl4pdf-api.herokuapp.com
```

### SSL Certificates
- Enable SSL on Heroku: `heroku certs:auto:enable`
- Configure SSL for static hosts (CloudFlare, CloudFront, etc.)

## 📊 Monitoring & Analytics

### Health Checks
```bash
# API Health
curl https://api.snackpdf.com/health

# Frontend Health
curl -I https://snackpdf.com
curl -I https://revisepdf.com
```

### Logging
- Heroku logs: `heroku logs --tail`
- Supabase logs: Available in dashboard
- Custom logging: Winston logs to files

### Analytics
- Google Analytics 4 integration
- Supabase analytics for database metrics
- Stripe dashboard for payment metrics

## 🔒 Security Checklist

### API Security
- [x] JWT token authentication
- [x] Rate limiting enabled
- [x] CORS properly configured
- [x] Input validation on all endpoints
- [x] SQL injection protection (Supabase RLS)
- [x] File upload restrictions

### Database Security
- [x] Row Level Security (RLS) enabled
- [x] Service role key secured
- [x] Database backups enabled
- [x] SSL connections enforced

### Frontend Security
- [x] HTTPS enforced
- [x] Content Security Policy headers
- [x] XSS protection
- [x] No sensitive data in client code

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check Supabase status
curl https://your-project.supabase.co/rest/v1/

# Verify environment variables
heroku config:get SUPABASE_URL
```

#### 2. File Upload Failures
```bash
# Check storage bucket permissions
supabase storage list

# Verify file size limits
heroku config:get MAX_FILE_SIZE
```

#### 3. Authentication Issues
```bash
# Check JWT secret
heroku config:get JWT_SECRET

# Verify Supabase auth settings
# Check in Supabase Dashboard > Authentication
```

### Performance Issues
- Monitor Heroku metrics
- Check database query performance
- Optimize file processing timeouts
- Review rate limiting settings

## 📈 Scaling Considerations

### Horizontal Scaling
- Multiple Heroku dynos
- Load balancer configuration
- Database connection pooling
- CDN for static assets

### Vertical Scaling
- Upgrade Heroku dyno types
- Increase database resources
- Optimize memory usage
- Cache frequently accessed data

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "cl4pdf-api"
          heroku_email: "your-email@example.com"
```

## 📞 Support

### Monitoring Alerts
Set up alerts for:
- API downtime
- High error rates
- Database connection issues
- Payment failures

### Backup Strategy
- Automated database backups (Supabase)
- Code repository backups (GitHub)
- Environment variable backups
- SSL certificate renewal alerts

---

**🎉 Deployment Complete!**

Your CL4PDF platform should now be live at:
- SnackPDF: https://snackpdf.com
- RevisePDF: https://revisepdf.com  
- API: https://api.snackpdf.com
