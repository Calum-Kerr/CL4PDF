/**
 * Advanced SEO Meta Tags and Schema Markup System for RevisePDF
 * Dynamically generates optimized meta tags and structured data
 */

class SEOManager {
    constructor() {
        this.baseUrl = 'https://revisepdf-frontend-c4aefb4be369.herokuapp.com';
        this.siteName = 'RevisePDF';
        this.defaultImage = `${this.baseUrl}/assets/images/revisepdf-og-image.png`;
        this.twitterHandle = '@revisepdf';
        this.init();
    }

    init() {
        this.addStructuredData();
        this.optimizeMetaTags();
        this.addBreadcrumbs();
        this.trackPageView();
    }

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
            "name": "RevisePDF",
            "url": this.baseUrl,
            "logo": `${this.baseUrl}/assets/images/logo.png`,
            "description": "Professional online PDF editor for filling forms, adding signatures, and editing documents. Trusted by businesses worldwide.",
            "foundingDate": "2025",
            "founder": {
                "@type": "Person",
                "name": "Calum Kerr",
                "url": "https://www.linkedin.com/in/calum-x-kerr"
            },
            "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "support@revisepdf.com",
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
            "name": "RevisePDF",
            "url": this.baseUrl,
            "description": "Professional PDF editor for forms, signatures, and document editing",
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${this.baseUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            },
            "publisher": {
                "@type": "Organization",
                "name": "RevisePDF"
            }
        };
    }

    getSoftwareApplicationSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "RevisePDF",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "description": "Professional PDF editor for filling forms, adding digital signatures, and editing documents online",
            "url": this.baseUrl,
            "screenshot": `${this.baseUrl}/assets/images/app-screenshot.png`,
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "850",
                "bestRating": "5",
                "worstRating": "1"
            },
            "offers": [
                {
                    "@type": "Offer",
                    "name": "Free Plan",
                    "price": "0",
                    "priceCurrency": "USD",
                    "description": "5 documents per month, basic editing tools"
                },
                {
                    "@type": "Offer",
                    "name": "Professional Plan",
                    "@type": "Offer",
                    "price": "9.99",
                    "priceCurrency": "USD",
                    "billingIncrement": "P1M",
                    "description": "Unlimited documents, advanced editing, templates, collaboration"
                }
            ],
            "featureList": [
                "PDF form filling",
                "Digital signatures",
                "Text editing",
                "Image insertion",
                "Template library",
                "Collaboration tools",
                "Document templates",
                "Industry-specific forms"
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
                question: "Can I edit PDF forms online with RevisePDF?",
                answer: "Yes, RevisePDF allows you to fill out PDF forms, add text, insert images, and digitally sign documents directly in your browser."
            },
            {
                question: "Are digital signatures legally binding?",
                answer: "Yes, RevisePDF's digital signatures are legally binding and comply with international e-signature standards including eIDAS and ESIGN Act."
            },
            {
                question: "What types of templates are available?",
                answer: "RevisePDF offers templates for business contracts, legal documents, medical forms, educational materials, and government forms."
            },
            {
                question: "Is my document data secure?",
                answer: "Absolutely. All documents are processed with enterprise-grade encryption and are never stored on our servers after editing."
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
        
        document.title = currentPage.title;
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
        this.updateMetaTag('author', 'RevisePDF Team', 'name');
        this.updateMetaTag('viewport', 'width=device-width, initial-scale=1.0', 'name');
        this.updateMetaTag('theme-color', '#238287', 'name');
        
        // Canonical URL
        this.updateLinkTag('canonical', window.location.href);
    }

    getCurrentPageInfo() {
        const path = window.location.pathname;
        const pageConfigs = {
            '/': {
                title: 'RevisePDF - Professional Online PDF Editor | Fill Forms & Sign Documents',
                description: 'Professional PDF editor for filling forms, adding digital signatures, and editing documents online. Trusted by businesses worldwide. Start editing PDFs instantly.',
                keywords: 'pdf editor, pdf form filler, digital signature, online pdf editor, edit pdf online, pdf signing'
            },
            '/editor': {
                title: 'PDF Editor Online | Edit PDFs Instantly - RevisePDF',
                description: 'Edit PDF documents online with our powerful PDF editor. Add text, images, signatures, and fill forms. Professional PDF editing made simple.',
                keywords: 'pdf editor online, edit pdf, pdf editing tool, online pdf editor free'
            },
            '/form-filler': {
                title: 'PDF Form Filler Online | Fill PDF Forms Instantly - RevisePDF',
                description: 'Fill PDF forms online quickly and easily. Professional form filling tool with templates for business, legal, and personal documents.',
                keywords: 'pdf form filler, fill pdf forms online, pdf forms, form filling tool'
            },
            '/esignature': {
                title: 'Digital Signature for PDFs | eSign Documents Online - RevisePDF',
                description: 'Add legally binding digital signatures to PDF documents. Secure, compliant, and professional e-signature solution.',
                keywords: 'digital signature, esignature, sign pdf online, electronic signature, pdf signing'
            },
            '/templates': {
                title: 'PDF Templates Library | Business & Legal Forms - RevisePDF',
                description: 'Access hundreds of professional PDF templates for business, legal, medical, and educational use. Download and customize instantly.',
                keywords: 'pdf templates, business forms, legal documents, contract templates'
            },
            '/pricing': {
                title: 'RevisePDF Pricing | Professional PDF Editor Plans',
                description: 'Choose the perfect RevisePDF plan for your needs. Free plan available. Professional plans start at $9.99/month with unlimited editing.',
                keywords: 'pdf editor pricing, revisepdf plans, professional pdf tools, pdf subscription'
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
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: document.title,
                page_location: window.location.href
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SEOManager();
});
