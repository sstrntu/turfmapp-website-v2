// Project Data
const projectData = {
    project1: {
        title: "E-Commerce Platform",
        description: "Full-stack online shopping platform with payment integration, user authentication, and admin dashboard.",
        tech: ["React", "Node.js", "MongoDB", "Stripe"],
        liveUrl: "https://example.com",
        githubUrl: "https://github.com/username/project1"
    },
    project2: {
        title: "Weather Dashboard",
        description: "Real-time weather application with geolocation, forecasts, and interactive maps.",
        tech: ["Vue.js", "API Integration", "Chart.js"],
        liveUrl: "https://example.com",
        githubUrl: "https://github.com/username/project2"
    },
    project3: {
        title: "Task Management App",
        description: "Collaborative project management tool with real-time updates, file sharing, and team chat.",
        tech: ["Angular", "Firebase", "WebSocket"],
        liveUrl: "https://example.com",
        githubUrl: "https://github.com/username/project3"
    },
    project4: {
        title: "AI Image Generator",
        description: "Machine learning powered image generation tool with custom training models.",
        tech: ["Python", "TensorFlow", "Flask", "AWS"],
        liveUrl: "https://example.com",
        githubUrl: "https://github.com/username/project4"
    },
    project5: {
        title: "Social Media Analytics",
        description: "Data visualization platform for social media metrics with predictive analytics.",
        tech: ["D3.js", "Python", "PostgreSQL", "Docker"],
        liveUrl: "https://example.com",
        githubUrl: "https://github.com/username/project5"
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Portfolio website initialized');
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        // Initialize parallax only if motion is allowed
        if (typeof initParallax === 'function') {
            initParallax();
        }
    }
    
    // Always initialize tooltips
    if (typeof initTooltips === 'function') {
        initTooltips();
    }
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (typeof handleResize === 'function') {
                handleResize();
            }
        }, 250);
    });
});

// Utility Functions
const utils = {
    // Throttle function for performance
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },
    
    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Check if device supports touch
    isTouchDevice: function() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },
    
    // Get viewport dimensions
    getViewportSize: function() {
        return {
            width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }
};

// Export for use in other modules
window.projectData = projectData;
window.utils = utils;