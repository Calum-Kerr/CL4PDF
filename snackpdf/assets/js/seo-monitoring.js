/**
 * SEO Monitoring and Optimization System
 * Tracks SEO metrics and provides optimization recommendations
 */

class SEOMonitor {
    constructor() {
        this.metrics = {};
        this.recommendations = [];
        this.init();
    }

    init() {
        this.analyzePageSEO();
        this.trackSEOMetrics();
        this.monitorPageSpeed();
        this.checkMobileOptimization();
        this.validateStructuredData();
    }

    // Comprehensive page SEO analysis
    analyzePageSEO() {
        const analysis = {
            title: this.analyzeTitleTag(),
            description: this.analyzeMetaDescription(),
            headings: this.analyzeHeadings(),
            images: this.analyzeImages(),
            links: this.analyzeLinks(),
            content: this.analyzeContent(),
            technical: this.analyzeTechnicalSEO()
        };

        this.metrics.seoAnalysis = analysis;
        this.generateRecommendations(analysis);
        
        return analysis;
    }

    // Analyze title tag
    analyzeTitleTag() {
        const title = document.title;
        const analysis = {
            content: title,
            length: title.length,
            optimal: title.length >= 30 && title.length <= 60,
            hasKeywords: this.containsKeywords(title),
            score: 0
        };

        // Calculate score
        if (analysis.optimal) analysis.score += 40;
        if (analysis.hasKeywords) analysis.score += 30;
        if (title.includes('SnackPDF')) analysis.score += 20;
        if (!title.includes('Untitled')) analysis.score += 10;

        return analysis;
    }

    // Analyze meta description
    analyzeMetaDescription() {
        const metaDesc = document.querySelector('meta[name="description"]');
        const content = metaDesc ? metaDesc.content : '';
        
        const analysis = {
            content: content,
            length: content.length,
            exists: !!metaDesc,
            optimal: content.length >= 120 && content.length <= 160,
            hasKeywords: this.containsKeywords(content),
            score: 0
        };

        // Calculate score
        if (analysis.exists) analysis.score += 30;
        if (analysis.optimal) analysis.score += 40;
        if (analysis.hasKeywords) analysis.score += 30;

        return analysis;
    }

    // Analyze heading structure
    analyzeHeadings() {
        const headings = {
            h1: document.querySelectorAll('h1'),
            h2: document.querySelectorAll('h2'),
            h3: document.querySelectorAll('h3'),
            h4: document.querySelectorAll('h4'),
            h5: document.querySelectorAll('h5'),
            h6: document.querySelectorAll('h6')
        };

        const analysis = {
            h1Count: headings.h1.length,
            h2Count: headings.h2.length,
            totalHeadings: Object.values(headings).reduce((sum, nodes) => sum + nodes.length, 0),
            hasH1: headings.h1.length > 0,
            multipleH1: headings.h1.length > 1,
            properHierarchy: this.checkHeadingHierarchy(headings),
            score: 0
        };

        // Calculate score
        if (analysis.hasH1 && !analysis.multipleH1) analysis.score += 40;
        if (analysis.h2Count > 0) analysis.score += 20;
        if (analysis.properHierarchy) analysis.score += 30;
        if (analysis.totalHeadings >= 3) analysis.score += 10;

        return analysis;
    }

    // Analyze images
    analyzeImages() {
        const images = document.querySelectorAll('img');
        let imagesWithAlt = 0;
        let imagesWithTitle = 0;
        let imagesWithLazyLoading = 0;

        images.forEach(img => {
            if (img.alt && img.alt.trim()) imagesWithAlt++;
            if (img.title && img.title.trim()) imagesWithTitle++;
            if (img.loading === 'lazy' || img.dataset.src) imagesWithLazyLoading++;
        });

        const analysis = {
            totalImages: images.length,
            imagesWithAlt: imagesWithAlt,
            imagesWithTitle: imagesWithTitle,
            imagesWithLazyLoading: imagesWithLazyLoading,
            altTextCoverage: images.length > 0 ? (imagesWithAlt / images.length) * 100 : 100,
            lazyLoadingCoverage: images.length > 0 ? (imagesWithLazyLoading / images.length) * 100 : 100,
            score: 0
        };

        // Calculate score
        if (analysis.altTextCoverage >= 90) analysis.score += 40;
        else if (analysis.altTextCoverage >= 70) analysis.score += 20;
        
        if (analysis.lazyLoadingCoverage >= 50) analysis.score += 30;
        if (analysis.imagesWithTitle > 0) analysis.score += 10;

        return analysis;
    }

    // Analyze links
    analyzeLinks() {
        const links = document.querySelectorAll('a');
        let internalLinks = 0;
        let externalLinks = 0;
        let linksWithTitle = 0;
        let linksWithNofollow = 0;

        links.forEach(link => {
            if (link.hostname === window.location.hostname) {
                internalLinks++;
            } else {
                externalLinks++;
                if (link.rel && link.rel.includes('nofollow')) {
                    linksWithNofollow++;
                }
            }
            if (link.title && link.title.trim()) linksWithTitle++;
        });

        const analysis = {
            totalLinks: links.length,
            internalLinks: internalLinks,
            externalLinks: externalLinks,
            linksWithTitle: linksWithTitle,
            linksWithNofollow: linksWithNofollow,
            internalToExternalRatio: externalLinks > 0 ? internalLinks / externalLinks : internalLinks,
            score: 0
        };

        // Calculate score
        if (analysis.internalLinks > 0) analysis.score += 30;
        if (analysis.internalToExternalRatio >= 2) analysis.score += 20;
        if (analysis.linksWithTitle > 0) analysis.score += 20;
        if (analysis.externalLinks > 0 && analysis.linksWithNofollow > 0) analysis.score += 10;

        return analysis;
    }

    // Analyze content
    analyzeContent() {
        const textContent = document.body.textContent || '';
        const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        
        const analysis = {
            wordCount: wordCount,
            characterCount: textContent.length,
            readabilityScore: this.calculateReadabilityScore(textContent),
            keywordDensity: this.calculateKeywordDensity(textContent),
            hasEnoughContent: wordCount >= 300,
            score: 0
        };

        // Calculate score
        if (analysis.hasEnoughContent) analysis.score += 40;
        if (analysis.readabilityScore >= 60) analysis.score += 30;
        if (analysis.keywordDensity >= 1 && analysis.keywordDensity <= 3) analysis.score += 30;

        return analysis;
    }

    // Analyze technical SEO
    analyzeTechnicalSEO() {
        const analysis = {
            hasCanonical: !!document.querySelector('link[rel="canonical"]'),
            hasRobotsMeta: !!document.querySelector('meta[name="robots"]'),
            hasViewportMeta: !!document.querySelector('meta[name="viewport"]'),
            hasCharsetMeta: !!document.querySelector('meta[charset]'),
            hasStructuredData: !!document.querySelector('script[type="application/ld+json"]'),
            hasOpenGraph: !!document.querySelector('meta[property^="og:"]'),
            hasTwitterCard: !!document.querySelector('meta[name^="twitter:"]'),
            httpsEnabled: window.location.protocol === 'https:',
            score: 0
        };

        // Calculate score
        Object.keys(analysis).forEach(key => {
            if (key !== 'score' && analysis[key]) {
                analysis.score += 12.5; // 8 factors, 100 points total
            }
        });

        return analysis;
    }

    // Track SEO metrics over time
    trackSEOMetrics() {
        const metrics = {
            timestamp: Date.now(),
            url: window.location.href,
            title: document.title,
            description: this.getMetaDescription(),
            loadTime: this.getPageLoadTime(),
            seoScore: this.calculateOverallSEOScore()
        };

        // Store metrics locally
        const storedMetrics = JSON.parse(localStorage.getItem('seo_metrics') || '[]');
        storedMetrics.push(metrics);
        
        // Keep only last 50 entries
        if (storedMetrics.length > 50) {
            storedMetrics.splice(0, storedMetrics.length - 50);
        }
        
        localStorage.setItem('seo_metrics', JSON.stringify(storedMetrics));

        // Send to analytics
        if (window.analytics) {
            window.analytics.trackEvent('seo_metrics', metrics);
        }
    }

    // Monitor page speed
    monitorPageSpeed() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                const metrics = {
                    loadTime: navigation.loadEventEnd - navigation.fetchStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                    firstPaint: this.getFirstPaint(),
                    firstContentfulPaint: this.getFirstContentfulPaint()
                };

                this.metrics.pageSpeed = metrics;
                
                // Track slow pages
                if (metrics.loadTime > 3000) {
                    this.recommendations.push({
                        type: 'performance',
                        priority: 'high',
                        message: `Page load time is ${Math.round(metrics.loadTime)}ms. Consider optimizing images, minifying CSS/JS, or using a CDN.`
                    });
                }
            }
        }
    }

    // Check mobile optimization
    checkMobileOptimization() {
        const viewport = document.querySelector('meta[name="viewport"]');
        const hasViewport = !!viewport;
        const isResponsive = hasViewport && viewport.content.includes('width=device-width');
        
        const analysis = {
            hasViewportMeta: hasViewport,
            isResponsive: isResponsive,
            isMobileOptimized: isResponsive && this.checkResponsiveDesign(),
            score: 0
        };

        if (analysis.hasViewportMeta) analysis.score += 40;
        if (analysis.isResponsive) analysis.score += 40;
        if (analysis.isMobileOptimized) analysis.score += 20;

        this.metrics.mobileOptimization = analysis;
    }

    // Validate structured data
    validateStructuredData() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        const analysis = {
            hasStructuredData: scripts.length > 0,
            structuredDataCount: scripts.length,
            validStructuredData: 0,
            errors: []
        };

        scripts.forEach((script, index) => {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@context'] && data['@type']) {
                    analysis.validStructuredData++;
                } else {
                    analysis.errors.push(`Script ${index + 1}: Missing @context or @type`);
                }
            } catch (error) {
                analysis.errors.push(`Script ${index + 1}: Invalid JSON - ${error.message}`);
            }
        });

        analysis.score = analysis.hasStructuredData ? 
            (analysis.validStructuredData / analysis.structuredDataCount) * 100 : 0;

        this.metrics.structuredData = analysis;
    }

    // Helper methods
    containsKeywords(text) {
        const keywords = ['pdf', 'merge', 'split', 'compress', 'convert', 'snackpdf'];
        return keywords.some(keyword => text.toLowerCase().includes(keyword));
    }

    checkHeadingHierarchy(headings) {
        // Simplified hierarchy check
        return headings.h1.length === 1 && headings.h2.length > 0;
    }

    calculateReadabilityScore(text) {
        // Simplified Flesch Reading Ease score
        const sentences = text.split(/[.!?]+/).length;
        const words = text.split(/\s+/).length;
        const syllables = this.countSyllables(text);
        
        if (sentences === 0 || words === 0) return 0;
        
        const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
        return Math.max(0, Math.min(100, score));
    }

    countSyllables(text) {
        // Simplified syllable counting
        return text.toLowerCase().match(/[aeiouy]+/g)?.length || 1;
    }

    calculateKeywordDensity(text) {
        const words = text.toLowerCase().split(/\s+/);
        const totalWords = words.length;
        const keywordCount = words.filter(word => 
            ['pdf', 'merge', 'split', 'compress', 'convert'].includes(word)
        ).length;
        
        return totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;
    }

    getMetaDescription() {
        const meta = document.querySelector('meta[name="description"]');
        return meta ? meta.content : '';
    }

    getPageLoadTime() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            return navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
        }
        return 0;
    }

    getFirstPaint() {
        const paint = performance.getEntriesByName('first-paint')[0];
        return paint ? paint.startTime : 0;
    }

    getFirstContentfulPaint() {
        const paint = performance.getEntriesByName('first-contentful-paint')[0];
        return paint ? paint.startTime : 0;
    }

    checkResponsiveDesign() {
        // Simple check for responsive design
        const hasMediaQueries = Array.from(document.styleSheets).some(sheet => {
            try {
                return Array.from(sheet.cssRules || []).some(rule => 
                    rule.type === CSSRule.MEDIA_RULE
                );
            } catch (e) {
                return false;
            }
        });
        
        return hasMediaQueries;
    }

    calculateOverallSEOScore() {
        if (!this.metrics.seoAnalysis) return 0;
        
        const weights = {
            title: 0.2,
            description: 0.15,
            headings: 0.15,
            images: 0.1,
            links: 0.1,
            content: 0.15,
            technical: 0.15
        };
        
        let totalScore = 0;
        Object.keys(weights).forEach(key => {
            if (this.metrics.seoAnalysis[key]) {
                totalScore += this.metrics.seoAnalysis[key].score * weights[key];
            }
        });
        
        return Math.round(totalScore);
    }

    generateRecommendations(analysis) {
        this.recommendations = [];
        
        // Title recommendations
        if (analysis.title.score < 70) {
            this.recommendations.push({
                type: 'title',
                priority: 'high',
                message: 'Optimize your title tag: ensure it\'s 30-60 characters and includes target keywords.'
            });
        }
        
        // Description recommendations
        if (analysis.description.score < 70) {
            this.recommendations.push({
                type: 'description',
                priority: 'high',
                message: 'Add or improve meta description: 120-160 characters with compelling copy and keywords.'
            });
        }
        
        // Heading recommendations
        if (analysis.headings.score < 70) {
            this.recommendations.push({
                type: 'headings',
                priority: 'medium',
                message: 'Improve heading structure: use one H1, multiple H2s, and maintain proper hierarchy.'
            });
        }
        
        // Image recommendations
        if (analysis.images.score < 70) {
            this.recommendations.push({
                type: 'images',
                priority: 'medium',
                message: 'Add alt text to images and implement lazy loading for better performance.'
            });
        }
        
        // Content recommendations
        if (analysis.content.score < 70) {
            this.recommendations.push({
                type: 'content',
                priority: 'medium',
                message: 'Improve content: aim for 300+ words with good readability and keyword optimization.'
            });
        }
    }

    // Get SEO report
    getSEOReport() {
        return {
            metrics: this.metrics,
            recommendations: this.recommendations,
            overallScore: this.calculateOverallSEOScore(),
            timestamp: Date.now()
        };
    }
}

// Initialize SEO monitoring
document.addEventListener('DOMContentLoaded', () => {
    window.seoMonitor = new SEOMonitor();
    
    // Log SEO report in development
    if (window.location.hostname === 'localhost') {
        console.log('SEO Report:', window.seoMonitor.getSEOReport());
    }
});

// Export for global use
window.getSEOReport = () => {
    return window.seoMonitor ? window.seoMonitor.getSEOReport() : null;
};
