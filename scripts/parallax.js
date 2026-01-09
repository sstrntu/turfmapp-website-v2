// 3D Parallax Effect Controller
class ParallaxController {
    constructor() {
        this.container = null;
        this.scene = null;
        this.isActive = false;
        this.isDragging = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.startX = 0;
        this.startY = 0;
        this.maxTilt = 12; // Increased for more dramatic 3D effect
        this.sensitivity = 0.6; // Higher sensitivity for better 3D rotation
        this.smoothing = 0.12; // Smoother for 3D rotation
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.container = document.getElementById('mapContainer');
        this.scene = document.getElementById('parallaxScene');
        
        if (!this.container || !this.scene) {
            console.warn('Parallax elements not found');
            return;
        }
        
        this.bindEvents();
        this.startAnimation();
        this.isActive = true;
        
        // Add parallax class for CSS styling
        this.container.classList.add('parallax-active');
    }
    
    bindEvents() {
        // Mouse drag events for desktop
        this.scene.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.scene.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.scene.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.scene.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Touch drag events for mobile
        this.scene.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.scene.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.scene.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Prevent default drag behavior on images
        this.scene.addEventListener('dragstart', (e) => e.preventDefault());
        
        // Handle window focus/blur for performance
        window.addEventListener('blur', this.pause.bind(this));
        window.addEventListener('focus', this.resume.bind(this));
        
        // Global mouse up to handle dragging outside the element
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    
    handleMouseDown(event) {
        this.isDragging = true;
        this.isActive = true;
        this.startX = event.clientX;
        this.startY = event.clientY;
        this.scene.style.cursor = 'grabbing';
        this.container.style.transition = 'none';
        event.preventDefault();
    }
    
    handleMouseMove(event) {
        if (!this.isDragging || !this.isActive) return;
        
        // Calculate drag distance from start point
        const deltaX = event.clientX - this.startX;
        const deltaY = event.clientY - this.startY;
        
        // Convert drag distance to rotation values
        const rect = this.scene.getBoundingClientRect();
        this.mouseX = (deltaX / rect.width) * 2; // Scale factor for sensitivity
        this.mouseY = (deltaY / rect.height) * 2;
        
        // Clamp values between -1 and 1
        this.mouseX = Math.max(-1, Math.min(1, this.mouseX));
        this.mouseY = Math.max(-1, Math.min(1, this.mouseY));
    }
    
    handleMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.scene.style.cursor = 'grab';
            this.container.style.transition = 'transform 0.5s ease-out';
            
            // Optional: Return to center after release (uncomment if desired)
            // setTimeout(() => {
            //     this.mouseX = 0;
            //     this.mouseY = 0;
            // }, 1000);
        }
    }
    
    handleMouseLeave() {
        if (this.isDragging) {
            this.handleMouseUp();
        }
    }
    
    handleTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.isDragging = true;
            this.isActive = true;
            this.startX = touch.clientX;
            this.startY = touch.clientY;
            this.container.style.transition = 'none';
            event.preventDefault();
        }
    }
    
    handleTouchMove(event) {
        if (!this.isDragging || !this.isActive || event.touches.length !== 1) return;
        
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.startX;
        const deltaY = touch.clientY - this.startY;
        
        const rect = this.scene.getBoundingClientRect();
        this.mouseX = (deltaX / rect.width) * 2;
        this.mouseY = (deltaY / rect.height) * 2;
        
        this.mouseX = Math.max(-1, Math.min(1, this.mouseX));
        this.mouseY = Math.max(-1, Math.min(1, this.mouseY));
        
        event.preventDefault();
    }
    
    handleTouchEnd(event) {
        this.isDragging = false;
        this.container.style.transition = 'transform 0.5s ease-out';
    }
    
    updateTransform() {
        if (!this.container) return;
        
        // Smooth interpolation for fluid movement
        this.currentX += (this.mouseX - this.currentX) * this.smoothing;
        this.currentY += (this.mouseY - this.currentY) * this.smoothing;
        
        // Calculate movement values for parallax
        const moveX = this.currentX * 80; // Increased for more visible separation
        const moveY = this.currentY * 80;
        
        // Calculate 3D rotation values
        const rotateX = this.currentY * this.maxTilt * this.sensitivity;
        const rotateY = -this.currentX * this.maxTilt * this.sensitivity;
        
        // Update each parallax layer with different 3D rotation amounts
        const layers = this.container.querySelectorAll('.parallax-layer');
        layers.forEach((layer, index) => {
            const layerDepth = parseInt(layer.dataset.depth) || 0;
            
            // Different rotation multipliers for 3D parallax depth
            let rotationMultiplier, translateMultiplier;
            switch(layerDepth) {
                case 0: // Background layer - minimal rotation, slight translation
                    rotationMultiplier = 0.3;
                    translateMultiplier = 0.1;
                    break;
                case 1: // Foreground layer (structures) - more rotation, more translation
                    rotationMultiplier = 1.0;
                    translateMultiplier = 0.5;
                    break;
                default:
                    rotationMultiplier = 0.5;
                    translateMultiplier = 0.3;
            }
            
            // Calculate layer-specific transforms
            const layerRotateX = rotateX * rotationMultiplier;
            const layerRotateY = rotateY * rotationMultiplier;
            const layerMoveX = moveX * translateMultiplier;
            const layerMoveY = moveY * translateMultiplier;
            
            // Apply 3D transform to each layer individually
            layer.style.transform = `
                perspective(1200px)
                rotateX(${layerRotateX}deg)
                rotateY(${layerRotateY}deg)
                translateX(${layerMoveX}px) 
                translateY(${layerMoveY}px)
                translateZ(0)
            `;
        });
        
        // Individual hotspot parallax within their layers
        const hotspots = this.container.querySelectorAll('.project-hotspot');
        hotspots.forEach((hotspot) => {
            const customDepth = parseInt(hotspot.dataset.depth) || 20;
            const parallaxStrength = customDepth / 20;
            const parallaxX = this.currentX * parallaxStrength * 5;
            const parallaxY = this.currentY * parallaxStrength * 5;
            
            hotspot.style.transform = `
                translate(-50%, -50%) 
                translateX(${parallaxX}px)
                translateY(${parallaxY}px)
            `;
        });
        
        // Update CSS custom properties for additional effects
        document.documentElement.style.setProperty('--mouse-x', this.currentX);
        document.documentElement.style.setProperty('--mouse-y', this.currentY);
    }
    
    startAnimation() {
        const animate = () => {
            this.updateTransform();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    pause() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resume() {
        if (!this.animationId) {
            this.isActive = true;
            this.startAnimation();
        }
    }
    
    destroy() {
        this.pause();
        this.container?.classList.remove('parallax-active');
        
        // Remove event listeners
        this.scene?.removeEventListener('mousedown', this.handleMouseDown);
        this.scene?.removeEventListener('mousemove', this.handleMouseMove);
        this.scene?.removeEventListener('mouseup', this.handleMouseUp);
        this.scene?.removeEventListener('mouseleave', this.handleMouseLeave);
        this.scene?.removeEventListener('touchstart', this.handleTouchStart);
        this.scene?.removeEventListener('touchmove', this.handleTouchMove);
        this.scene?.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('blur', this.pause);
        window.removeEventListener('focus', this.resume);
    }
    
    updateSettings(settings = {}) {
        this.maxTilt = settings.maxTilt || this.maxTilt;
        this.sensitivity = settings.sensitivity || this.sensitivity;
        this.smoothing = settings.smoothing || this.smoothing;
    }
}

// Initialize function
let parallaxController = null;

function initParallax() {
    // Check if device and browser support 3D transforms
    if (!CSS.supports('transform', 'perspective(1px)')) {
        console.warn('3D transforms not supported');
        return;
    }
    
    // Enable on all devices since we're using drag interaction
    // Touch devices will use touch drag events
    
    try {
        parallaxController = new ParallaxController();
        console.log('Parallax initialized successfully');
    } catch (error) {
        console.error('Failed to initialize parallax:', error);
    }
}

function handleResize() {
    // Reset parallax on resize
    if (parallaxController) {
        parallaxController.currentX = 0;
        parallaxController.currentY = 0;
        parallaxController.mouseX = 0;
        parallaxController.mouseY = 0;
    }
}

// Cleanup function
function destroyParallax() {
    if (parallaxController) {
        parallaxController.destroy();
        parallaxController = null;
    }
}

// Export for global access
window.initParallax = initParallax;
window.destroyParallax = destroyParallax;
window.handleResize = handleResize;