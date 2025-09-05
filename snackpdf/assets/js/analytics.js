/**
 * SnackPDF Analytics
 * Simple analytics and user tracking
 */

class Analytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = localStorage.getItem('user_id') || null;
        this.events = [];
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
window.analytics = new Analytics();

// Track page view on load
document.addEventListener('DOMContentLoaded', () => {
    window.analytics.pageView();
});

console.log('SnackPDF analytics initialized');