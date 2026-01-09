// Tooltip System for Project Interactions
class TooltipManager {
    constructor() {
        this.tooltip = null;
        this.hotspots = [];
        this.activeHotspot = null;
        this.hideTimeout = null;
        this.showDelay = 300;
        this.hideDelay = 150;
        
        this.init();
    }
    
    init() {
        this.tooltip = document.getElementById('projectTooltip');
        this.hotspots = Array.from(document.querySelectorAll('.project-hotspot'));
        
        if (!this.tooltip) {
            console.warn('Tooltip element not found');
            return;
        }
        
        this.bindEvents();
        console.log(`Tooltip manager initialized with ${this.hotspots.length} hotspots`);
    }
    
    bindEvents() {
        this.hotspots.forEach(hotspot => {
            // Mouse events
            hotspot.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, hotspot));
            hotspot.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, hotspot));
            hotspot.addEventListener('mousemove', (e) => this.handleMouseMove(e, hotspot));
            
            // Touch events for mobile
            hotspot.addEventListener('touchstart', (e) => this.handleTouchStart(e, hotspot));
            hotspot.addEventListener('click', (e) => this.handleClick(e, hotspot));
        });
        
        // Hide tooltip when clicking outside
        document.addEventListener('click', (e) => this.handleDocumentClick(e));
        
        // Hide tooltip when scrolling (if scrolling is enabled)
        window.addEventListener('scroll', () => this.hideTooltip(), { passive: true });
        
        // Handle window resize
        window.addEventListener('resize', utils.debounce(() => this.updateTooltipPosition(), 250));
    }
    
    handleMouseEnter(event, hotspot) {
        clearTimeout(this.hideTimeout);
        
        this.showTimeout = setTimeout(() => {
            this.showTooltip(hotspot, event);
        }, this.showDelay);
    }
    
    handleMouseLeave(event, hotspot) {
        clearTimeout(this.showTimeout);
        
        this.hideTimeout = setTimeout(() => {
            this.hideTooltip();
        }, this.hideDelay);
    }
    
    handleMouseMove(event, hotspot) {
        if (this.activeHotspot === hotspot && this.tooltip.classList.contains('visible')) {
            this.updateTooltipPosition(event);
        }
    }
    
    handleTouchStart(event, hotspot) {
        event.preventDefault();
        this.showTooltip(hotspot, event);
    }
    
    handleClick(event, hotspot) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.activeHotspot === hotspot && this.tooltip.classList.contains('visible')) {
            this.hideTooltip();
        } else {
            this.showTooltip(hotspot, event);
        }
    }
    
    handleDocumentClick(event) {
        if (!this.tooltip.contains(event.target) && 
            !event.target.closest('.project-hotspot')) {
            this.hideTooltip();
        }
    }
    
    showTooltip(hotspot, event) {
        const projectId = hotspot.dataset.project;
        const projectInfo = window.projectData[projectId];
        
        if (!projectInfo) {
            console.warn(`Project data not found for: ${projectId}`);
            return;
        }
        
        this.activeHotspot = hotspot;
        this.populateTooltip(projectInfo);
        this.positionTooltip(hotspot, event);
        
        // Show tooltip with animation
        requestAnimationFrame(() => {
            this.tooltip.classList.add('visible');
        });
        
        // Add active state to hotspot
        hotspot.classList.add('active');
    }
    
    hideTooltip() {
        if (!this.tooltip) return;
        
        this.tooltip.classList.remove('visible');
        
        if (this.activeHotspot) {
            this.activeHotspot.classList.remove('active');
            this.activeHotspot = null;
        }
        
        clearTimeout(this.showTimeout);
        clearTimeout(this.hideTimeout);
    }
    
    populateTooltip(projectInfo) {
        const titleEl = this.tooltip.querySelector('.tooltip-title');
        const descriptionEl = this.tooltip.querySelector('.tooltip-description');
        const techEl = this.tooltip.querySelector('.tooltip-tech');
        const liveLink = this.tooltip.querySelector('.tooltip-link.live');
        const githubLink = this.tooltip.querySelector('.tooltip-link.github');
        
        // Populate content
        if (titleEl) titleEl.textContent = projectInfo.title;
        if (descriptionEl) descriptionEl.textContent = projectInfo.description;
        
        // Populate tech stack
        if (techEl) {
            techEl.innerHTML = projectInfo.tech
                .map(tech => `<span class="tech-tag">${tech}</span>`)
                .join('');
        }
        
        // Update links
        if (liveLink) {
            liveLink.href = projectInfo.liveUrl;
            liveLink.style.display = projectInfo.liveUrl ? 'inline-block' : 'none';
        }
        
        if (githubLink) {
            githubLink.href = projectInfo.githubUrl;
            githubLink.style.display = projectInfo.githubUrl ? 'inline-block' : 'none';
        }
    }
    
    positionTooltip(hotspot, event) {
        if (!this.tooltip || !hotspot) return;
        
        const viewport = utils.getViewportSize();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const hotspotRect = hotspot.getBoundingClientRect();
        
        // Mobile positioning
        if (utils.isTouchDevice() || viewport.width < 768) {
            this.tooltip.style.left = '50%';
            this.tooltip.style.top = 'auto';
            this.tooltip.style.bottom = '20px';
            this.tooltip.style.transform = 'translateX(-50%)';
            this.tooltip.className = 'tooltip visible bottom';
            return;
        }
        
        // Desktop positioning
        const spacing = 15;
        let left = hotspotRect.left + hotspotRect.width / 2;
        let top = hotspotRect.top - tooltipRect.height - spacing;
        let position = 'top';
        
        // Adjust if tooltip goes off screen
        if (top < spacing) {
            top = hotspotRect.bottom + spacing;
            position = 'bottom';
        }
        
        if (left + tooltipRect.width / 2 > viewport.width - spacing) {
            left = hotspotRect.right + spacing;
            top = hotspotRect.top + hotspotRect.height / 2 - tooltipRect.height / 2;
            position = 'left';
        }
        
        if (left - tooltipRect.width / 2 < spacing) {
            left = hotspotRect.left - spacing;
            top = hotspotRect.top + hotspotRect.height / 2 - tooltipRect.height / 2;
            position = 'right';
        }
        
        // Apply positioning
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.transform = position === 'top' || position === 'bottom' 
            ? 'translateX(-50%)' 
            : 'translateY(-50%)';
        
        // Update tooltip class for arrow positioning
        this.tooltip.className = `tooltip visible ${position}`;
    }
    
    updateTooltipPosition(event) {
        if (!this.activeHotspot || !this.tooltip.classList.contains('visible')) return;
        
        if (event && !utils.isTouchDevice()) {
            // Follow mouse on desktop
            const spacing = 15;
            const tooltipRect = this.tooltip.getBoundingClientRect();
            const viewport = utils.getViewportSize();
            
            let left = event.clientX;
            let top = event.clientY - tooltipRect.height - spacing;
            
            // Keep tooltip on screen
            if (left + tooltipRect.width > viewport.width - spacing) {
                left = viewport.width - tooltipRect.width - spacing;
            }
            if (left < spacing) {
                left = spacing;
            }
            if (top < spacing) {
                top = event.clientY + spacing;
            }
            
            this.tooltip.style.left = `${left}px`;
            this.tooltip.style.top = `${top}px`;
            this.tooltip.style.transform = 'none';
        }
    }
    
    destroy() {
        this.hideTooltip();
        
        // Remove all event listeners
        this.hotspots.forEach(hotspot => {
            hotspot.removeEventListener('mouseenter', this.handleMouseEnter);
            hotspot.removeEventListener('mouseleave', this.handleMouseLeave);
            hotspot.removeEventListener('mousemove', this.handleMouseMove);
            hotspot.removeEventListener('touchstart', this.handleTouchStart);
            hotspot.removeEventListener('click', this.handleClick);
        });
        
        document.removeEventListener('click', this.handleDocumentClick);
        window.removeEventListener('scroll', this.hideTooltip);
        window.removeEventListener('resize', this.updateTooltipPosition);
    }
}

// Initialize function
let tooltipManager = null;

function initTooltips() {
    try {
        tooltipManager = new TooltipManager();
        console.log('Tooltips initialized successfully');
    } catch (error) {
        console.error('Failed to initialize tooltips:', error);
    }
}

// Cleanup function
function destroyTooltips() {
    if (tooltipManager) {
        tooltipManager.destroy();
        tooltipManager = null;
    }
}

// Export for global access
window.initTooltips = initTooltips;
window.destroyTooltips = destroyTooltips;