/**
 * Page Generation Script
 * Automatically generates all missing HTML pages for SnackPDF and RevisePDF
 */

const fs = require('fs');
const path = require('path');

// Page templates and configurations
const pageConfigs = {
    snackpdf: {
        tools: [
            { name: 'word-to-pdf', title: 'Word to PDF', description: 'Convert Word documents to PDF format', icon: 'file-pdf' },
            { name: 'edit-pdf', title: 'Edit PDF', description: 'Add text, images, and annotations to PDFs', icon: 'pencil-square' },
            { name: 'sign-pdf', title: 'Sign PDF', description: 'Add electronic signatures to documents', icon: 'pen' },
            { name: 'protect-pdf', title: 'Protect PDF', description: 'Add password protection to PDFs', icon: 'lock' },
            { name: 'organize-pdf', title: 'Organize PDF', description: 'Reorder, rotate, and delete PDF pages', icon: 'arrows-move' },
            { name: 'pdf-to-jpg', title: 'PDF to JPG', description: 'Convert PDF pages to JPG images', icon: 'image' },
            { name: 'jpg-to-pdf', title: 'JPG to PDF', description: 'Convert JPG images to PDF', icon: 'file-pdf' },
            { name: 'excel-to-pdf', title: 'Excel to PDF', description: 'Convert Excel spreadsheets to PDF', icon: 'file-pdf' },
            { name: 'pdf-to-excel', title: 'PDF to Excel', description: 'Convert PDF tables to Excel', icon: 'file-spreadsheet' },
            { name: 'powerpoint-to-pdf', title: 'PowerPoint to PDF', description: 'Convert presentations to PDF', icon: 'file-pdf' },
            { name: 'pdf-to-powerpoint', title: 'PDF to PowerPoint', description: 'Convert PDF to PowerPoint', icon: 'file-slides' },
            { name: 'ocr-pdf', title: 'OCR PDF', description: 'Make scanned PDFs searchable', icon: 'eye' },
            { name: 'convert-pdf', title: 'Convert PDF', description: 'All-in-one PDF converter', icon: 'arrow-repeat' }
        ],
        business: [
            { name: 'features', title: 'Features', description: 'Discover all SnackPDF features' },
            { name: 'about', title: 'About Us', description: 'Learn about SnackPDF' },
            { name: 'contact', title: 'Contact', description: 'Get in touch with us' },
            { name: 'help', title: 'Help Center', description: 'Find answers and tutorials' },
            { name: 'faq', title: 'FAQ', description: 'Frequently asked questions' }
        ],
        auth: [
            { name: 'login', title: 'Login', description: 'Sign in to your account' },
            { name: 'signup', title: 'Sign Up', description: 'Create a new account' }
        ],
        legal: [
            { name: 'privacy', title: 'Privacy Policy', description: 'Our privacy policy' },
            { name: 'terms', title: 'Terms of Service', description: 'Terms and conditions' },
            { name: 'blog', title: 'Blog', description: 'Latest news and tutorials' }
        ]
    },
    revisepdf: {
        features: [
            { name: 'form-filler', title: 'Form Filler', description: 'Fill PDF forms automatically', icon: 'ui-checks' },
            { name: 'esignature', title: 'eSignature', description: 'Electronic document signing', icon: 'pen' },
            { name: 'collaboration', title: 'Collaboration', description: 'Team document collaboration', icon: 'people' },
            { name: 'api', title: 'API', description: 'Developer API access', icon: 'code-slash' }
        ],
        solutions: [
            { name: 'enterprise', title: 'Enterprise', description: 'Solutions for large organizations' },
            { name: 'small-business', title: 'Small Business', description: 'Perfect for small teams' },
            { name: 'healthcare', title: 'Healthcare', description: 'HIPAA-compliant solutions' },
            { name: 'legal', title: 'Legal', description: 'Legal industry solutions' },
            { name: 'education', title: 'Education', description: 'Educational institution tools' },
            { name: 'features', title: 'Features', description: 'All RevisePDF features' }
        ],
        templates: {
            categories: [
                { name: 'tax', title: 'Tax Forms', description: 'IRS and tax-related forms' },
                { name: 'business', title: 'Business Forms', description: 'Business documents and contracts' },
                { name: 'legal', title: 'Legal Documents', description: 'Legal forms and agreements' },
                { name: 'medical', title: 'Medical Forms', description: 'Healthcare and medical forms' },
                { name: 'real-estate', title: 'Real Estate', description: 'Property and real estate forms' },
                { name: 'government', title: 'Government Forms', description: 'Official government documents' },
                { name: 'education', title: 'Education Forms', description: 'School and university forms' },
                { name: 'personal', title: 'Personal Documents', description: 'Personal and family forms' }
            ],
            individual: [
                { name: 'w9', title: 'W-9 Form', description: 'Request for Taxpayer Identification' },
                { name: 'job-application', title: 'Job Application', description: 'Employment application form' },
                { name: 'rental-agreement', title: 'Rental Agreement', description: 'Residential lease agreement' },
                { name: 'invoice', title: 'Invoice Template', description: 'Professional invoice form' }
            ]
        },
        business: [
            { name: 'pricing', title: 'Pricing', description: 'Choose your plan' },
            { name: 'help', title: 'Help Center', description: 'Support and documentation' },
            { name: 'contact', title: 'Contact', description: 'Get in touch' },
            { name: 'api-docs', title: 'API Documentation', description: 'Developer resources' },
            { name: 'status', title: 'System Status', description: 'Service status page' },
            { name: 'demo', title: 'Demo', description: 'Product demonstration' },
            { name: 'security', title: 'Security', description: 'Security information' }
        ],
        legal: [
            { name: 'privacy', title: 'Privacy Policy', description: 'Privacy policy' },
            { name: 'terms', title: 'Terms of Service', description: 'Terms and conditions' },
            { name: 'gdpr', title: 'GDPR Compliance', description: 'GDPR information' }
        ],
        auth: [
            { name: 'login', title: 'Login', description: 'Sign in to your account' },
            { name: 'signup', title: 'Sign Up', description: 'Create a new account' },
            { name: 'account', title: 'Account Dashboard', description: 'Manage your account' }
        ]
    },
    shared: [
        { name: 'about-us', title: 'About Us', description: 'Learn about our company' },
        { name: 'privacy-policy', title: 'Privacy Policy', description: 'Our privacy policy' },
        { name: 'terms-of-service', title: 'Terms of Service', description: 'Terms and conditions' },
        { name: 'help-center', title: 'Help Center', description: 'Support and help' },
        { name: 'contact-us', title: 'Contact Us', description: 'Get in touch' },
        { name: 'support', title: 'Support', description: 'Customer support' },
        { name: 'company', title: 'Company', description: 'Company information' }
    ]
};

// Base HTML template
const getBaseTemplate = (site, page) => {
    const siteConfig = {
        snackpdf: {
            name: 'SnackPDF',
            domain: 'snackpdf.com',
            description: 'Free online PDF tools',
            color: '#238287'
        },
        revisepdf: {
            name: 'RevisePDF',
            domain: 'revisepdf.com',
            description: 'Professional PDF editing platform',
            color: '#238287'
        },
        shared: {
            name: 'CL4PDF',
            domain: 'snackpdf.com',
            description: 'PDF tools and services',
            color: '#238287'
        }
    };

    const config = siteConfig[site];
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title} | ${config.name} - ${config.description}</title>
    <meta name="description" content="${page.description}">
    <meta name="keywords" content="${page.title.toLowerCase()}, ${config.name.toLowerCase()}, PDF tools">
    <meta name="author" content="${config.name}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://${config.domain}/${page.name}">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${page.title} | ${config.name}">
    <meta property="og:description" content="${page.description}">
    <meta property="og:image" content="https://${config.domain}/assets/images/og-${page.name}.jpg">
    <meta property="og:url" content="https://${config.domain}/${page.name}">
    <meta property="og:type" content="website">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${page.title} | ${config.name}">
    <meta name="twitter:description" content="${page.description}">
    <meta name="twitter:image" content="https://${config.domain}/assets/images/twitter-${page.name}.jpg">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/assets/images/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png">
    
    <!-- Bootstrap 5.3 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <!-- Header -->
    <header class="header fixed-top">
        <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
            <div class="container">
                <!-- Logo -->
                <a class="navbar-brand" href="/">
                    <img src="/assets/images/logo.svg" alt="${config.name}" height="40">
                </a>
                
                <!-- Mobile Toggle -->
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <!-- Navigation -->
                <div class="collapse navbar-collapse" id="navbarNav">
                    ${getNavigation(site)}
                    
                    <!-- Auth Buttons -->
                    <div class="navbar-nav">
                        <a class="nav-link" href="/login">Login</a>
                        <a class="btn btn-primary ms-2" href="/signup">Sign Up</a>
                    </div>
                </div>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="main-content">
        ${getPageContent(site, page)}
    </main>

    ${getFooter(site)}

    <!-- Bootstrap 5.3 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom JS -->
    <script src="/assets/js/${page.name}.js"></script>
</body>
</html>`;
};

// Navigation generator
const getNavigation = (site) => {
    if (site === 'snackpdf') {
        return `<ul class="navbar-nav me-auto">
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    All PDF Tools
                </a>
                <ul class="dropdown-menu">
                    <li><h6 class="dropdown-header">Organize PDF</h6></li>
                    <li><a class="dropdown-item" href="/merge-pdf">Merge PDF</a></li>
                    <li><a class="dropdown-item" href="/split-pdf">Split PDF</a></li>
                    <li><a class="dropdown-item" href="/compress-pdf">Compress PDF</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><h6 class="dropdown-header">Convert PDF</h6></li>
                    <li><a class="dropdown-item" href="/pdf-to-word">PDF to Word</a></li>
                    <li><a class="dropdown-item" href="/word-to-pdf">Word to PDF</a></li>
                    <li><a class="dropdown-item" href="/pdf-to-jpg">PDF to JPG</a></li>
                </ul>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/pricing">Pricing</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/features">Features</a>
            </li>
        </ul>`;
    } else {
        return `<ul class="navbar-nav me-auto">
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    Solutions
                </a>
                <ul class="dropdown-menu">
                    <li><h6 class="dropdown-header">By Business Size</h6></li>
                    <li><a class="dropdown-item" href="/enterprise">Enterprise</a></li>
                    <li><a class="dropdown-item" href="/small-business">Small Business</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><h6 class="dropdown-header">By Industry</h6></li>
                    <li><a class="dropdown-item" href="/healthcare">Healthcare</a></li>
                    <li><a class="dropdown-item" href="/legal">Legal</a></li>
                    <li><a class="dropdown-item" href="/education">Education</a></li>
                </ul>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/features">Features</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/pricing">Pricing</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/templates">Templates</a>
            </li>
        </ul>`;
    }
};

// Page content generator
const getPageContent = (site, page) => {
    return `<!-- Hero Section -->
    <section class="hero-section py-5 bg-light">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8 text-center">
                    <h1 class="display-4 fw-bold mb-3">${page.title}</h1>
                    <p class="lead mb-4">${page.description}</p>
                    <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                        <a href="#" class="btn btn-primary btn-lg">Get Started</a>
                        <a href="#" class="btn btn-outline-primary btn-lg">Learn More</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Content Section -->
    <section class="content-section py-5">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h2>Coming Soon</h2>
                            <p>This page is under construction. Please check back soon for updates.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>`;
};

// Footer generator
const getFooter = (site) => {
    const siteConfig = {
        snackpdf: 'SnackPDF',
        revisepdf: 'RevisePDF'
    };

    return `<!-- Footer -->
    <footer class="footer bg-dark text-light py-5">
        <div class="container">
            <div class="row">
                <div class="col-md-3 mb-4">
                    <h5>${siteConfig[site]}</h5>
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
                    <p class="mb-0">&copy; 2025 ${siteConfig[site]}. All rights reserved.</p>
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

// Generate all pages
const generateAllPages = () => {
    console.log('🚀 Starting page generation...');
    
    let totalPages = 0;
    
    // Generate SnackPDF pages
    Object.entries(pageConfigs.snackpdf).forEach(([category, pages]) => {
        pages.forEach(page => {
            const html = getBaseTemplate('snackpdf', page);
            const filePath = path.join(__dirname, '..', 'snackpdf', `${page.name}.html`);
            
            fs.writeFileSync(filePath, html);
            console.log(`✅ Created: snackpdf/${page.name}.html`);
            totalPages++;
        });
    });
    
    // Generate RevisePDF pages
    Object.entries(pageConfigs.revisepdf).forEach(([category, pages]) => {
        if (category === 'templates') {
            // Handle template categories
            pages.categories.forEach(page => {
                const html = getBaseTemplate('revisepdf', page);
                const dir = path.join(__dirname, '..', 'revisepdf', 'templates');
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                
                const filePath = path.join(dir, `${page.name}.html`);
                fs.writeFileSync(filePath, html);
                console.log(`✅ Created: revisepdf/templates/${page.name}.html`);
                totalPages++;
            });
            
            // Handle individual templates
            pages.individual.forEach(page => {
                const html = getBaseTemplate('revisepdf', page);
                const dir = path.join(__dirname, '..', 'revisepdf', 'templates');
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                
                const filePath = path.join(dir, `${page.name}.html`);
                fs.writeFileSync(filePath, html);
                console.log(`✅ Created: revisepdf/templates/${page.name}.html`);
                totalPages++;
            });
        } else {
            pages.forEach(page => {
                const html = getBaseTemplate('revisepdf', page);
                const filePath = path.join(__dirname, '..', 'revisepdf', `${page.name}.html`);
                
                fs.writeFileSync(filePath, html);
                console.log(`✅ Created: revisepdf/${page.name}.html`);
                totalPages++;
            });
        }
    });
    
    // Generate shared pages (create in both snackpdf and revisepdf directories)
    pageConfigs.shared.forEach(page => {
        // Create in snackpdf directory
        const htmlSnack = getBaseTemplate('snackpdf', page);
        const snackFilePath = path.join(__dirname, '..', 'snackpdf', `${page.name}.html`);
        fs.writeFileSync(snackFilePath, htmlSnack);
        console.log(`✅ Created: snackpdf/${page.name}.html`);
        totalPages++;

        // Create in revisepdf directory
        const htmlRevise = getBaseTemplate('revisepdf', page);
        const reviseFilePath = path.join(__dirname, '..', 'revisepdf', `${page.name}.html`);
        fs.writeFileSync(reviseFilePath, htmlRevise);
        console.log(`✅ Created: revisepdf/${page.name}.html`);
        totalPages++;
    });
    
    console.log(`\n🎉 Page generation complete!`);
    console.log(`📊 Total pages created: ${totalPages}`);
    console.log(`\n📝 Next steps:`);
    console.log(`1. Customize individual page content as needed`);
    console.log(`2. Add specific functionality to tool pages`);
    console.log(`3. Create corresponding JavaScript files`);
    console.log(`4. Test all pages and links`);
};

// Run the generator
if (require.main === module) {
    generateAllPages();
}

module.exports = { generateAllPages, pageConfigs };
