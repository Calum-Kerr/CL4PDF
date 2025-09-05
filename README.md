# CL4PDF - PDF Tools Platform

A comprehensive PDF processing platform with two main products:
- **SnackPDF** (snackpdf.com) - iLovePDF clone with all-in-one PDF tools
- **RevisePDF** (revisepdf.com) - PDFfiller clone with live PDF editing

## 🏗️ Architecture

### Monorepo Structure
```
CL4PDF/
├── snackpdf/           # SnackPDF frontend (iLovePDF clone)
├── revisepdf/          # RevisePDF frontend (PDFfiller clone)  
├── api/                # Shared backend API (Flask/Express)
├── core/               # Shared utilities (auth, payments, etc.)
├── supabase/           # Database schema and migrations
├── scripts/            # Dev tools, SEO scripts, deploy steps
├── docs/               # Documentation
└── README.md
```

### Tech Stack
- **Frontend**: HTML + Bootstrap 5.3 + Vanilla JS
- **Backend**: Python Flask (or Node.js Express)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (subscriptions only)
- **Storage**: Supabase Storage
- **Hosting**: Heroku
- **Development**: VSCode

### Brand Colors
- **Primary Brand**: #238287 (Teal)
- **Primary Dark**: #1a5f63 (hover states)
- **Primary Light**: #e2f8f5 (light backgrounds)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Python 3.9+
- Supabase account
- Stripe account
- Heroku CLI

### Environment Setup
1. Clone the repository
2. Copy `.env.template` to `.env`
3. Fill in your API keys and configuration
4. Run database migrations
5. Start development servers

### Database Setup
The complete database schema is in `supabase/schema.sql` with:
- User management and authentication
- Stripe subscription handling
- PDF job processing tracking
- Document management for RevisePDF
- Template library for forms
- Comprehensive audit logging
- Row Level Security (RLS)
- Performance indexes

## 📊 Database Schema

### Core Tables
- `users` - User profiles extending Supabase auth
- `user_sessions` - Session tracking
- `subscriptions` - Stripe subscription management
- `pdf_jobs` - All PDF processing operations
- `job_status` - Async operation tracking
- `user_documents` - Document management (RevisePDF)
- `pdf_templates` - Form template library
- `audit_log` - Analytics and usage tracking

### Key Features
- **Row Level Security**: Users can only access their own data
- **Audit Logging**: Complete activity tracking for analytics
- **Subscription Management**: Full Stripe integration
- **Multi-platform**: Supports both SnackPDF and RevisePDF
- **Performance Optimized**: Comprehensive indexing strategy

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install  # or pip install -r requirements.txt

# Start development servers
npm run dev:snackpdf    # SnackPDF frontend
npm run dev:revisepdf   # RevisePDF frontend  
npm run dev:api         # Backend API

# Or start all at once
npm run dev
```

### Database Migrations
```bash
# Apply schema
supabase db push

# Reset database (development only)
supabase db reset
```

## 🎯 Product Features

### SnackPDF (iLovePDF Clone)
**Tool Categories:**
- **Organize PDF**: Merge, Split, Remove pages, Extract pages, Organize, Scan to PDF
- **Optimize PDF**: Compress, Repair, OCR
- **Convert PDF**: JPG/Word/PowerPoint/Excel/HTML to PDF and vice versa
- **Edit PDF**: Rotate, Add page numbers, Add watermark, Crop, Edit text/images
- **PDF Security**: Unlock, Protect, Sign, Redact, Compare

### RevisePDF (PDFfiller Clone)
**Core Features:**
- Live PDF editing in browser
- Form filling and field management
- Template library (tax forms, legal documents, etc.)
- eSignature capabilities
- Document collaboration
- Form builder tools

## 🔐 Security

### Authentication
- Supabase Auth with JWT tokens
- Row Level Security (RLS) policies
- Session management and tracking

### Data Protection
- All user data isolated by RLS
- Secure file upload/download
- HTTPS everywhere
- GDPR compliant audit logging

## 💳 Monetization

### Subscription Tiers
- **Free**: 10 operations/month, basic tools
- **Premium**: Unlimited operations, advanced tools, no watermarks
- **Business**: Team features, API access, priority support
- **Enterprise**: Custom solutions, dedicated support

### Stripe Integration
- Subscription management
- Webhook handling
- Usage tracking and limits
- Automatic billing

## 📈 SEO Strategy

### Technical SEO
- Server-side rendering for tool pages
- Optimized meta tags and structured data
- XML sitemaps
- Fast loading times

### Content Strategy
- Tool-specific landing pages
- How-to guides and tutorials
- Blog content for organic traffic
- Template library for long-tail keywords

## 🚀 Deployment

### Heroku Setup
```bash
# Create Heroku apps
heroku create snackpdf-app
heroku create revisepdf-app
heroku create cl4pdf-api

# Configure environment variables
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key
heroku config:set STRIPE_SECRET_KEY=your_key

# Deploy
git push heroku main
```

### Environment Variables
See `.env.template` for complete list of required environment variables.

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is a private project. Contact the maintainer for contribution guidelines.

---

**Built with ❤️ for PDF productivity**
