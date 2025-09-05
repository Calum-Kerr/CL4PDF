/**
 * Performance Optimization & Core Web Vitals Tracking
 * Optimizes page performance and tracks Core Web Vitals metrics
 */

class PerformanceOptimizer {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        this.optimizeImages();
        this.implementLazyLoading();
        this.preloadCriticalResources();
        this.trackCoreWebVitals();
        this.optimizeScripts();
        this.setupServiceWorker();
    }

    // Optimize images for better performance
    optimizeImages() {
        // Convert images to WebP format when supported
        if (this.supportsWebP()) {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                const src = img.dataset.src;
                if (src && !src.includes('.webp')) {
                    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                    img.dataset.src = webpSrc;
                    img.dataset.fallback = src;
                }
            });
        }

        // Add loading="lazy" to images below the fold
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach((img, index) => {
            if (index > 2) { // Skip first 3 images (likely above fold)
                img.loading = 'lazy';
            }
        });
    }

    // Implement lazy loading for images and iframes
    implementLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyElements = document.querySelectorAll('[data-src]');
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        element.src = element.dataset.src;
                        element.classList.remove('lazy');
                        element.classList.add('loaded');
                        lazyObserver.unobserve(element);

                        // Handle fallback for WebP
                        if (element.dataset.fallback) {
                            element.onerror = () => {
                                element.src = element.dataset.fallback;
                            };
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            lazyElements.forEach(element => {
                lazyObserver.observe(element);
            });
        } else {
            // Fallback for browsers without IntersectionObserver
            const lazyElements = document.querySelectorAll('[data-src]');
            lazyElements.forEach(element => {
                element.src = element.dataset.src;
            });
        }
    }

    // Preload critical resources
    preloadCriticalResources() {
        const criticalResources = [
            { href: '/assets/css/style.css', as: 'style' },
            { href: '/assets/js/main.js', as: 'script' },
            { href: '/assets/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.type) link.type = resource.type;
            if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
            document.head.appendChild(link);
        });

        // Preconnect to external domains
        const preconnectDomains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdn.jsdelivr.net',
            'https://www.googletagmanager.com'
        ];

        preconnectDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    // Track Core Web Vitals
    trackCoreWebVitals() {
        // Use web-vitals library if available
        if (typeof webVitals !== 'undefined') {
            webVitals.getCLS(this.sendToAnalytics.bind(this));
            webVitals.getFID(this.sendToAnalytics.bind(this));
            webVitals.getFCP(this.sendToAnalytics.bind(this));
            webVitals.getLCP(this.sendToAnalytics.bind(this));
            webVitals.getTTFB(this.sendToAnalytics.bind(this));
        } else {
            // Manual Core Web Vitals tracking
            this.trackLCP();
            this.trackFID();
            this.trackCLS();
        }

        // Track custom performance metrics
        this.trackCustomMetrics();
    }

    // Manual LCP tracking
    trackLCP() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.startTime;
                this.sendToAnalytics({ name: 'LCP', value: lastEntry.startTime });
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }

    // Manual FID tracking
    trackFID() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                    this.sendToAnalytics({ name: 'FID', value: entry.processingStart - entry.startTime });
                });
            });
            observer.observe({ entryTypes: ['first-input'] });
        }
    }

    // Manual CLS tracking
    trackCLS() {
        if ('PerformanceObserver' in window) {
            let clsValue = 0;
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.metrics.cls = clsValue;
                this.sendToAnalytics({ name: 'CLS', value: clsValue });
            });
            observer.observe({ entryTypes: ['layout-shift'] });
        }
    }

    // Track custom performance metrics
    trackCustomMetrics() {
        // Time to Interactive (TTI)
        window.addEventListener('load', () => {
            setTimeout(() => {
                const tti = performance.now();
                this.metrics.tti = tti;
                this.sendToAnalytics({ name: 'TTI', value: tti });
            }, 0);
        });

        // Resource loading times
        window.addEventListener('load', () => {
            const resources = performance.getEntriesByType('resource');
            const slowResources = resources.filter(resource => resource.duration > 1000);
            
            if (slowResources.length > 0) {
                this.sendToAnalytics({
                    name: 'slow_resources',
                    value: slowResources.length,
                    resources: slowResources.map(r => ({ name: r.name, duration: r.duration }))
                });
            }
        });
    }

    // Optimize script loading
    optimizeScripts() {
        // Defer non-critical scripts
        const nonCriticalScripts = document.querySelectorAll('script[data-defer]');
        nonCriticalScripts.forEach(script => {
            script.defer = true;
        });

        // Load scripts asynchronously when possible
        const asyncScripts = document.querySelectorAll('script[data-async]');
        asyncScripts.forEach(script => {
            script.async = true;
        });
    }

    // Setup Service Worker for caching
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    // Check WebP support
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // Send metrics to analytics
    sendToAnalytics(metric) {
        if (window.analytics && typeof window.analytics.trackEvent === 'function') {
            window.analytics.trackEvent('core_web_vital', {
                metric_name: metric.name,
                metric_value: metric.value,
                page_url: window.location.href
            });
        }

        // Also send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vital', {
                name: metric.name,
                value: Math.round(metric.value),
                event_category: 'Performance'
            });
        }
    }

    // Get performance summary
    getPerformanceSummary() {
        return {
            ...this.metrics,
            navigation: performance.getEntriesByType('navigation')[0],
            resources: performance.getEntriesByType('resource').length,
            timestamp: Date.now()
        };
    }
}

// Initialize performance optimizer
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
});

// Export for global use
window.getPerformanceMetrics = () => {
    return window.performanceOptimizer ? window.performanceOptimizer.getPerformanceSummary() : {};
};
