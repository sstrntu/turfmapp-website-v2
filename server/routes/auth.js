const express = require('express');
const bcrypt = require('bcrypt');
const { adminsDB } = require('../models/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Missing credentials',
                message: 'Username and password are required' 
            });
        }

        // Get admin user from database
        const admin = await adminsDB.getByUsername(username);
        
        if (!admin) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: 'Username or password is incorrect' 
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: 'Username or password is incorrect' 
            });
        }

        // Set session
        req.session.admin = {
            id: admin.id,
            username: admin.username
        };

        res.json({ 
            success: true,
            message: 'Login successful',
            admin: {
                id: admin.id,
                username: admin.username
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed',
            message: 'An error occurred during login' 
        });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                error: 'Logout failed',
                message: 'Could not log out, please try again' 
            });
        }
        
        res.clearCookie('connect.sid'); // Clear session cookie
        res.json({ 
            success: true,
            message: 'Logout successful' 
        });
    });
});

// Check authentication status
router.get('/status', (req, res) => {
    if (req.session && req.session.admin) {
        res.json({ 
            authenticated: true,
            admin: req.session.admin 
        });
    } else {
        res.json({ 
            authenticated: false 
        });
    }
});

// Change password endpoint
router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                error: 'Missing passwords',
                message: 'Current and new passwords are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'Weak password',
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Get current admin
        const admin = await adminsDB.getByUsername(req.session.admin.username);
        
        if (!admin) {
            return res.status(404).json({ 
                error: 'Admin not found',
                message: 'Admin user not found' 
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, admin.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid password',
                message: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        
        // Update password in database
        await adminsDB.updatePassword(admin.username, newPasswordHash);

        res.json({ 
            success: true,
            message: 'Password changed successfully' 
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ 
            error: 'Password change failed',
            message: 'An error occurred while changing password' 
        });
    }
});

module.exports = router;