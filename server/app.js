const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const uploadRoutes = require('./routes/uploads');

// Import database
const { initializeDatabase } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Session configuration
app.use(session({
    secret: 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Create necessary directories
const directories = ['uploads', 'uploads/images', 'uploads/videos', 'data'];
directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use('/', express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);

// Admin routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

app.get('/admin/dashboard', (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, '..', 'admin', 'dashboard.html'));
});

app.get('/admin/editor', (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, '..', 'admin', 'editor.html'));
});

// Portfolio route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// API route to get projects for portfolio
app.get('/api/data/projects.json', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'data', 'projects.json'));
});

// Initialize database and start server
console.log('🔄 Initializing database...');
initializeDatabase().then(() => {
    console.log('✅ Database initialized, starting server...');
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
        console.log(`🎨 Portfolio: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
});

module.exports = app;