/**
 * Advanced SEO Meta Tags and Schema Markup System
 * Dynamically generates optimized meta tags and structured data
 */

class SEOManager {
    constructor() {
        this.baseUrl = 'https://snackpdf-frontend-31ae65e54ecf.herokuapp.com';
        this.siteName = 'SnackPDF';
        this.defaultImage = `${this.baseUrl}/assets/images/snackpdf-og-image.png`;
        this.twitterHandle = '@snackpdf';
        this.init();
    }

    init() {
        this.addStructuredData();
        this.optimizeMetaTags();
        this.addBreadcrumbs();
        this.trackPageView();
    }

    // Generate comprehensive structured data
    addStructuredData() {
        const schemas = [
            this.getOrganizationSchema(),
            this.getWebsiteSchema(),
            this.getSoftwareApplicationSchema(),
            this.getBreadcrumbSchema(),
            this.getFAQSchema()
        ];

        schemas.forEach(schema => {
            if (schema) {
                const script = document.createElement('script');
                script.type = 'application/ld+json';
                script.textContent = JSON.stringify(schema);
                document.head.appendChild(script);
            }
        });
    }

    getOrganizationSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "SnackPDF",
            "url": this.baseUrl,
            "logo": `${this.baseUrl}/assets/images/logo.png`,
            "description": "Free online PDF tools for merging, splitting, compressing, and converting PDF files. Fast, secure, and easy to use.",
            "foundingDate": "2025",
            "founder": {
                "@type": "Person",
                "name": "Calum Kerr",
                "url": "https://www.linkedin.com/in/calum-x-kerr"
            },
            "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "support@snackpdf.com",
                "availableLanguage": "English"
            },
            "sameAs": [
                "https://www.linkedin.com/in/calum-x-kerr"
            ],
            "address": {
                "@type": "PostalAddress",
                "addressCountry": "GB",
                "addressRegion": "Scotland"
            }
        };
    }

    getWebsiteSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "SnackPDF",
            "url": this.baseUrl,
            "description": "Free online PDF tools for all your document needs",
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${this.baseUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            },
            "publisher": {
                "@type": "Organization",
                "name": "SnackPDF"
            }
        };
    }

    getSoftwareApplicationSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "SnackPDF",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "description": "Comprehensive PDF toolkit for merging, splitting, compressing, and converting PDF files online",
            "url": this.baseUrl,
            "screenshot": `${this.baseUrl}/assets/images/app-screenshot.png`,
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1250",
                "bestRating": "5",
                "worstRating": "1"
            },
            "offers": [
                {
                    "@type": "Offer",
                    "name": "Free Plan",
                    "price": "0",
                    "priceCurrency": "USD",
                    "description": "10 operations per month, basic PDF tools"
                },
                {
                    "@type": "Offer",
                    "name": "Premium Plan",
                    "price": "4.99",
                    "priceCurrency": "USD",
                    "billingIncrement": "P1M",
                    "description": "Unlimited operations, all PDF tools, no watermarks"
                }
            ],
            "featureList": [
                "Merge PDF files",
                "Split PDF documents",
                "Compress PDF size",
                "Convert PDF to Word",
                "Convert Word to PDF",
                "PDF to Excel conversion",
                "Secure PDF protection",
                "Digital PDF signing"
            ]
        };
    }

    getBreadcrumbSchema() {
        const path = window.location.pathname;
        const breadcrumbs = this.generateBreadcrumbs(path);
        
        if (breadcrumbs.length <= 1) return null;

        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((crumb, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": crumb.name,
                "item": crumb.url
            }))
        };
    }

    getFAQSchema() {
        const faqData = [
            {
                question: "Is SnackPDF free to use?",
                answer: "Yes, SnackPDF offers a free plan with 10 operations per month. Premium plans are available for unlimited usage."
            },
            {
                question: "Are my PDF files secure?",
                answer: "Absolutely. All files are processed locally in your browser and automatically deleted from our servers after processing."
            },
            {
                question: "What file formats does SnackPDF support?",
                answer: "SnackPDF supports PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX), and image formats (JPG, PNG)."
            },
            {
                question: "Is there a file size limit?",
                answer: "Free users can process files up to 25MB. Premium users can handle files up to 100MB, and Business users up to 500MB."
            }
        ];

        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        };
    }

    optimizeMetaTags() {
        const currentPage = this.getCurrentPageInfo();
        
        // Update title
        document.title = currentPage.title;
        
        // Update meta description
        this.updateMetaTag('description', currentPage.description);
        
        // Open Graph tags
        this.updateMetaTag('og:title', currentPage.title, 'property');
        this.updateMetaTag('og:description', currentPage.description, 'property');
        this.updateMetaTag('og:image', currentPage.image || this.defaultImage, 'property');
        this.updateMetaTag('og:url', window.location.href, 'property');
        this.updateMetaTag('og:type', 'website', 'property');
        this.updateMetaTag('og:site_name', this.siteName, 'property');
        
        // Twitter Card tags
        this.updateMetaTag('twitter:card', 'summary_large_image', 'name');
        this.updateMetaTag('twitter:site', this.twitterHandle, 'name');
        this.updateMetaTag('twitter:title', currentPage.title, 'name');
        this.updateMetaTag('twitter:description', currentPage.description, 'name');
        this.updateMetaTag('twitter:image', currentPage.image || this.defaultImage, 'name');
        
        // Additional SEO tags
        this.updateMetaTag('robots', 'index, follow', 'name');
        this.updateMetaTag('author', 'SnackPDF Team', 'name');
        this.updateMetaTag('viewport', 'width=device-width, initial-scale=1.0', 'name');
        this.updateMetaTag('theme-color', '#238287', 'name');
        
        // Canonical URL
        this.updateLinkTag('canonical', window.location.href);
    }

    getCurrentPageInfo() {
        const path = window.location.pathname;
        const pageConfigs = {
            '/': {
                title: 'SnackPDF - Free Online PDF Tools | Merge, Split, Compress PDFs',
                description: 'Free online PDF tools for all your document needs. Merge, split, compress, and convert PDF files instantly. No registration required. Fast, secure, and easy to use.',
                keywords: 'pdf tools, merge pdf, split pdf, compress pdf, pdf converter, free pdf tools, online pdf editor'
            },
            '/merge-pdf': {
                title: 'Merge PDF Files Online Free | Combine Multiple PDFs - SnackPDF',
                description: 'Merge multiple PDF files into one document online for free. Fast, secure PDF merger with no file size limits. Combine PDFs in seconds.',
                keywords: 'merge pdf, combine pdf, pdf merger, join pdf files, merge pdf online free'
            },
            '/split-pdf': {
                title: 'Split PDF Online Free | Extract Pages from PDF - SnackPDF',
                description: 'Split PDF files online for free. Extract specific pages or split into multiple documents. Fast, secure, and easy PDF splitter tool.',
                keywords: 'split pdf, pdf splitter, extract pdf pages, divide pdf, separate pdf pages'
            },
            '/compress-pdf': {
                title: 'Compress PDF Online Free | Reduce PDF File Size - SnackPDF',
                description: 'Compress PDF files online to reduce file size while maintaining quality. Free PDF compressor with optimal compression algorithms.',
                keywords: 'compress pdf, reduce pdf size, pdf compressor, shrink pdf, optimize pdf'
            },
            '/pricing': {
                title: 'SnackPDF Pricing | Free & Premium PDF Tools Plans',
                description: 'Choose the perfect SnackPDF plan for your needs. Free plan available with 10 operations/month. Premium plans start at $4.99/month.',
                keywords: 'pdf tools pricing, snackpdf plans, premium pdf tools, pdf subscription'
            }
        };

        const config = pageConfigs[path] || pageConfigs['/'];
        return {
            title: config.title,
            description: config.description,
            keywords: config.keywords,
            image: this.defaultImage
        };
    }

    updateMetaTag(name, content, attribute = 'name') {
        let tag = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(attribute, name);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    }

    updateLinkTag(rel, href) {
        let tag = document.querySelector(`link[rel="${rel}"]`);
        if (!tag) {
            tag = document.createElement('link');
            tag.setAttribute('rel', rel);
            document.head.appendChild(tag);
        }
        tag.setAttribute('href', href);
    }

    generateBreadcrumbs(path) {
        const segments = path.split('/').filter(segment => segment);
        const breadcrumbs = [{ name: 'Home', url: this.baseUrl }];
        
        let currentPath = '';
        segments.forEach(segment => {
            currentPath += '/' + segment;
            const name = this.formatBreadcrumbName(segment);
            breadcrumbs.push({
                name: name,
                url: this.baseUrl + currentPath
            });
        });
        
        return breadcrumbs;
    }

    formatBreadcrumbName(segment) {
        return segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    addBreadcrumbs() {
        const breadcrumbs = this.generateBreadcrumbs(window.location.pathname);
        if (breadcrumbs.length <= 1) return;

        const breadcrumbContainer = document.querySelector('.breadcrumb-container');
        if (breadcrumbContainer) {
            const breadcrumbHTML = breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return `
                    <li class="breadcrumb-item ${isLast ? 'active' : ''}">
                        ${isLast ? crumb.name : `<a href="${crumb.url}">${crumb.name}</a>`}
                    </li>
                `;
            }).join('');

            breadcrumbContainer.innerHTML = `
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        ${breadcrumbHTML}
                    </ol>
                </nav>
            `;
        }
    }

    trackPageView() {
        // Google Analytics 4 tracking
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: document.title,
                page_location: window.location.href
            });
        }
    }
}

// Initialize SEO Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SEOManager();
});
