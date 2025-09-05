/**
 * SnackPDF Main JavaScript
 * Handles tool filtering, animations, and basic interactions
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeToolFilters();
    initializeAnimations();
    initializeToolCards();
    initializeNavigation();
});

/**
 * Tool Filtering System
 */
function initializeToolFilters() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    const toolCards = document.querySelectorAll('[data-category]');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter tool cards
            toolCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    card.classList.add('fade-in');
                } else {
                    card.style.display = 'none';
                    card.classList.remove('fade-in');
                }
            });
            
            // Trigger animation for visible cards
            setTimeout(() => {
                const visibleCards = document.querySelectorAll('[data-category]:not([style*="display: none"])');
                visibleCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, index * 100);
                });
            }, 50);
        });
    });
}

/**
 * Scroll Animations
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
    
    // Observe all tool cards
    document.querySelectorAll('.tool-card').forEach(card => {
        card.classList.add('fade-in');
        observer.observe(card);
    });
    
    // Observe feature cards
    document.querySelectorAll('.features-section .col-md-4').forEach(feature => {
        feature.classList.add('fade-in');
        observer.observe(feature);
    });
}

/**
 * Tool Card Interactions
 */
function initializeToolCards() {
    const toolCards = document.querySelectorAll('.tool-card');
    
    toolCards.forEach(card => {
        // Add click handler for entire card
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking the button directly
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }
            
            const link = this.querySelector('a.btn');
            if (link) {
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
 * Utility Functions
 */

// Show loading state
function showLoading(element) {
    element.classList.add('loading');
    element.style.pointerEvents = 'none';
}

// Hide loading state
function hideLoading(element) {
    element.classList.remove('loading');
    element.style.pointerEvents = 'auto';
}

// Show toast notification
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

// Analytics tracking (placeholder)
function trackEvent(eventName, properties = {}) {
    // This will be implemented with actual analytics
    console.log('Track Event:', eventName, properties);
    
    // Example: Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
}

// Track tool usage
function trackToolUsage(toolName) {
    trackEvent('tool_selected', {
        tool_name: toolName,
        platform: 'snackpdf'
    });
}

// Add click tracking to tool buttons
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.tool-card a.btn').forEach(button => {
        button.addEventListener('click', function() {
            const toolCard = this.closest('.tool-card');
            const toolName = toolCard.querySelector('.card-title').textContent.trim();
            trackToolUsage(toolName);
        });
    });
});

/**
 * Error Handling
 */
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    // Could send to error tracking service
});

/**
 * Performance Monitoring
 */
window.addEventListener('load', function() {
    // Track page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    trackEvent('page_load_time', {
        load_time: loadTime,
        page: 'home'
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

// Export functions for use in other scripts
window.SnackPDF = {
    showLoading,
    hideLoading,
    showToast,
    trackEvent,
    trackToolUsage,
    isMobile,
    isTablet,
    isDesktop
};
