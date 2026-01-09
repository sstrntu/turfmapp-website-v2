# Interactive 3D Portfolio Website

A modern portfolio website featuring an interactive bird's-eye view map with 3D parallax effects and clickable project elements.

## Features

- **3D Parallax Effect**: Mouse-controlled tilting (10-20 degrees) for immersive experience
- **Interactive Map**: Clickable hotspots revealing project details via tooltips
- **Responsive Design**: Optimized for desktop and mobile devices
- **Smooth Animations**: 60fps performance with hardware acceleration
- **Accessibility**: Support for reduced motion preferences

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **3D Effects**: CSS 3D transforms with JavaScript mouse tracking
- **Styling**: Modern CSS with flexbox and grid
- **Performance**: Throttled events and optimized animations

## Project Structure

```
/
├── index.html              # Main homepage
├── styles/
│   ├── main.css           # Core styles and layout
│   ├── parallax.css       # 3D parallax effects
│   └── tooltips.css       # Tooltip styling
├── scripts/
│   ├── main.js            # App initialization and utilities
│   ├── parallax.js        # 3D mouse tracking system
│   └── tooltips.js        # Interactive tooltip system
├── assets/
│   ├── images/
│   │   └── portfolio-map.jpg  # Main map image
│   └── data/
│       └── projects.json  # Project information
└── README.md
```

## Getting Started

1. **Setup**: Simply open `index.html` in a modern web browser
2. **Map Image**: Replace `assets/images/portfolio-map.jpg` with your custom map
3. **Project Data**: Edit `scripts/main.js` or `assets/data/projects.json` to add your projects
4. **Hotspot Positioning**: Adjust the `style` attributes on `.project-hotspot` elements in `index.html`

## Customization

### Adding Projects

Edit the `projectData` object in `scripts/main.js`:

```javascript
const projectData = {
    projectX: {
        title: "Your Project Title",
        description: "Project description...",
        tech: ["Technology", "Stack"],
        liveUrl: "https://your-live-demo.com",
        githubUrl: "https://github.com/username/repo"
    }
};
```

### Positioning Hotspots

Adjust the `top` and `left` CSS properties on hotspot elements:

```html
<div class="project-hotspot" data-project="projectX" style="top: 30%; left: 50%;">
    <div class="hotspot-marker"></div>
</div>
```

### Parallax Settings

Modify parallax behavior in `scripts/parallax.js`:

```javascript
this.maxTilt = 15;        // Maximum tilt in degrees
this.sensitivity = 0.5;   // Mouse sensitivity
this.smoothing = 0.1;     // Animation smoothness
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Notes

- 3D parallax is disabled on touch devices for better performance
- Animations respect `prefers-reduced-motion` accessibility setting
- Uses `requestAnimationFrame` for smooth 60fps animations
- Throttled mouse events to prevent performance issues

## License

Open source - feel free to use and modify for your own portfolio!