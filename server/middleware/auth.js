// Authentication middleware to protect admin routes
function requireAuth(req, res, next) {
    if (req.session && req.session.admin) {
        next(); // User is authenticated
    } else {
        res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Please log in to access this resource' 
        });
    }
}

// Check if user is already authenticated (for login page redirects)
function checkAuth(req, res, next) {
    if (req.session && req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    next();
}

module.exports = {
    requireAuth,
    checkAuth
};