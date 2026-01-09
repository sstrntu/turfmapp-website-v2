# Turfmapp Interactive Portfolio

A modern portfolio website featuring an interactive world map with camera controls and clickable project elements.

## Features

- **Camera Controls**: Mouse drag and edge movement for map exploration
- **Interactive Map**: Clickable hotspots revealing project details via tooltips
- **Smooth Movement**: 60fps camera controls with smooth interpolation  
- **Admin Panel**: Complete CMS for managing projects and content
- **Responsive Design**: Optimized for desktop and mobile devices
- **Accessibility**: Support for reduced motion preferences

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite with session management
- **Authentication**: bcrypt password hashing
- **File Upload**: Multer with Sharp image optimization
- **Styling**: Modern CSS with responsive design

## Project Structure

```
/
├── index.html              # Main portfolio page
├── server/                 # Backend server
│   ├── app.js             # Express server
│   └── models/            # Database models
├── admin/                  # CMS admin panel
│   ├── index.html         # Login page
│   ├── dashboard.html     # Admin dashboard
│   └── editor.html        # Project editor
├── assets/
│   └── images/
│       └── TM-world.png   # World map image
├── data/                  # Database and JSON files
└── uploads/               # User uploaded content
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
npm run setup
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access Application
- **Portfolio**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Default Login**: admin / admin123

## Admin Panel Features

### Project Management
- Add, edit, and delete portfolio projects
- Interactive coordinate picker for hotspot positioning
- Upload images and videos with automatic optimization
- Set project titles, descriptions, and external links

### Authentication
- Secure login system with bcrypt password hashing
- Session-based authentication
- Admin-only access to management features

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Notes

- Smooth camera controls with optimized interpolation
- Respects `prefers-reduced-motion` accessibility setting  
- Uses `requestAnimationFrame` for 60fps animations
- Optimized image handling with Sharp compression
- SQLite database for lightweight data storage

## License

MIT License - feel free to use and modify for your own projects!