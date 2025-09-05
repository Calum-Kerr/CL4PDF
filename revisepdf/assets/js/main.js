/**
 * RevisePDF Main JavaScript
 * Handles editor initialization, template browsing, and user interactions
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeNavigation();
    initializeFeatureCards();
    initializeTemplateCards();
});

/**
 * Animation System
 */
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.classList.add('fade-in');
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Observe template cards
    document.querySelectorAll('.template-card').forEach((card, index) => {
        card.classList.add('fade-in');
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Observe hero content
    const heroContent = document.querySelector('.hero .col-lg-6:first-child');
    const heroImage = document.querySelector('.hero .col-lg-6:last-child');
    
    if (heroContent) {
        heroContent.classList.add('slide-in-left');
        observer.observe(heroContent);
    }
    
    if (heroImage) {
        heroImage.classList.add('slide-in-right');
        observer.observe(heroImage);
    }
}

/**
 * Navigation Enhancements
 */
function initializeNavigation() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Header scroll effect
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

/**
 * Feature Card Interactions
 */
function initializeFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking a button or link
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }
            
            const link = this.querySelector('a.btn');
            if (link) {
                trackFeatureClick(this.querySelector('.card-title').textContent.trim());
                link.click();
            }
        });
        
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

/**
 * Template Card Interactions
 */
function initializeTemplateCards() {
    const templateCards = document.querySelectorAll('.template-card');
    
    templateCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking a button or link
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }
            
            const link = this.querySelector('a.btn');
            if (link) {
                const templateName = this.querySelector('.card-title').textContent.trim();
                trackTemplateClick(templateName);
                link.click();
            }
        });
        
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

/**
 * Main Action Functions
 */
function openEditor() {
    trackEvent('editor_opened', {
        source: 'hero_button',
        platform: 'revisepdf'
    });
    
    // This would open the PDF editor interface
    // For now, we'll show a placeholder
    showToast('PDF Editor will open here', 'info');
    
    // In production, this would redirect to the editor:
    // window.location.href = '/editor';
}

function browseTemplates() {
    trackEvent('templates_browsed', {
        source: 'hero_button',
        platform: 'revisepdf'
    });
    
    // Scroll to templates section or redirect
    const templatesSection = document.querySelector('.templates-section');
    if (templatesSection) {
        templatesSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    } else {
        window.location.href = '/templates';
    }
}

/**
 * Analytics and Tracking
 */
function trackEvent(eventName, properties = {}) {
    console.log('Track Event:', eventName, properties);
    
    // Example: Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
    
    // Example: Custom analytics
    if (window.analytics) {
        window.analytics.track(eventName, properties);
    }
}

function trackFeatureClick(featureName) {
    trackEvent('feature_clicked', {
        feature_name: featureName,
        platform: 'revisepdf',
        page: 'home'
    });
}

function trackTemplateClick(templateName) {
    trackEvent('template_clicked', {
        template_name: templateName,
        platform: 'revisepdf',
        page: 'home'
    });
}

/**
 * Utility Functions
 */
function showLoading(element) {
    element.classList.add('loading');
    element.style.pointerEvents = 'none';
}

function hideLoading(element) {
    element.classList.remove('loading');
    element.style.pointerEvents = 'auto';
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    // Add to toast container (create if doesn't exist)
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove from DOM after hiding
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

/**
 * User Authentication Helpers
 */
function isUserLoggedIn() {
    // This would check actual authentication state
    return localStorage.getItem('user_token') !== null;
}

function redirectToLogin() {
    window.location.href = '/login';
}

function redirectToSignup() {
    window.location.href = '/signup';
}

/**
 * Feature Access Control
 */
function requireAuth(callback) {
    if (isUserLoggedIn()) {
        callback();
    } else {
        showToast('Please log in to access this feature', 'warning');
        setTimeout(() => {
            redirectToLogin();
        }, 2000);
    }
}

/**
 * Error Handling
 */
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    
    // Track errors for monitoring
    trackEvent('javascript_error', {
        error_message: e.message,
        error_filename: e.filename,
        error_lineno: e.lineno,
        platform: 'revisepdf'
    });
});

/**
 * Performance Monitoring
 */
window.addEventListener('load', function() {
    // Track page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    trackEvent('page_load_time', {
        load_time: loadTime,
        page: 'home',
        platform: 'revisepdf'
    });
});

/**
 * Responsive Utilities
 */
function isMobile() {
    return window.innerWidth <= 768;
}

function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function isDesktop() {
    return window.innerWidth > 1024;
}

/**
 * Form Validation Helpers
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateRequired(value) {
    return value && value.trim().length > 0;
}

// Export functions for use in other scripts
window.RevisePDF = {
    openEditor,
    browseTemplates,
    showLoading,
    hideLoading,
    showToast,
    trackEvent,
    trackFeatureClick,
    trackTemplateClick,
    isUserLoggedIn,
    requireAuth,
    isMobile,
    isTablet,
    isDesktop,
    validateEmail,
    validateRequired
};
