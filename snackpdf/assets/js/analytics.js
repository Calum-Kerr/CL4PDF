/**
 * Comprehensive Analytics and Tracking System
 * Google Analytics 4, Search Console, and Custom Event Tracking
 */

class AnalyticsManager {
    constructor() {
        this.gaId = 'G-XXXXXXXXXX'; // Replace with actual GA4 ID
        this.gscId = 'XXXXXXXXXX'; // Replace with actual Search Console ID
        this.sessionId = this.generateSessionId();
        this.userId = localStorage.getItem('user_id') || null;
        this.events = [];
        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.loadGoogleAnalytics();
        this.setupCustomEvents();
        this.trackUserBehavior();
        this.setupConversionTracking();
    }

    // Load Google Analytics 4
    loadGoogleAnalytics() {
        // Load gtag script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
        document.head.appendChild(script);

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', this.gaId, {
            page_title: document.title,
            page_location: window.location.href,
            custom_map: {
                'custom_parameter_1': 'pdf_tool_used',
                'custom_parameter_2': 'user_plan_type'
            }
        });

        // Make gtag globally available
        window.gtag = gtag;
    }

    track(event, properties = {}) {
        const eventData = {
            event,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                session_id: this.sessionId,
                user_id: this.userId,
                page: window.location.pathname,
                referrer: document.referrer,
                user_agent: navigator.userAgent
            }
        };
        
        this.events.push(eventData);
        
        // Send to API if available
        if (window.CL4PDF_CONFIG) {
            this.sendEvent(eventData);
        }
        
        console.log('📊 Event tracked:', event, properties);
    }
    
    async sendEvent(eventData) {
        try {
            await window.apiCall('/api/analytics/track', {
                method: 'POST',
                body: JSON.stringify(eventData)
            });
        } catch (error) {
            // Silently fail - analytics shouldn't break the app
            console.debug('Analytics event failed to send:', error);
        }
    }
    
    pageView() {
        this.track('page_view', {
            title: document.title,
            url: window.location.href
        });
    }
    
    toolUsed(toolName) {
        this.track('tool_used', {
            tool: toolName,
            platform: 'snackpdf'
        });
    }
    
    fileUploaded(fileInfo) {
        this.track('file_uploaded', {
            file_size: fileInfo.size,
            file_type: fileInfo.type,
            file_name: fileInfo.name
        });
    }
    
    conversionCompleted(toolName, processingTime) {
        this.track('conversion_completed', {
            tool: toolName,
            processing_time: processingTime,
            platform: 'snackpdf'
        });
    }
}

// Initialize analytics
window.analytics = new AnalyticsManager();

// Track page view on load
document.addEventListener('DOMContentLoaded', () => {
    window.analytics.pageView();
});

// Export enhanced tracking functions
window.trackEvent = (eventName, parameters) => {
    if (window.analytics) {
        window.analytics.trackEvent(eventName, parameters);
    }
};

window.trackConversion = (conversionName, parameters) => {
    if (window.analytics) {
        window.analytics.trackConversion(conversionName, parameters);
    }
};

console.log('SnackPDF comprehensive analytics initialized');