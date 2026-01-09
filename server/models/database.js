const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'projects.db');

// Initialize database connection
function getDatabase() {
    return new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        }
    });
}

// Initialize database with tables and default admin user
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        // Create projects table
        db.serialize(() => {
            // Projects table
            db.run(`
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    image_url TEXT,
                    video_url TEXT,
                    links TEXT,
                    coordinates TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) console.error('Error creating projects table:', err.message);
            });

            // Admin users table
            db.run(`
                CREATE TABLE IF NOT EXISTS admins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, async (err) => {
                if (err) {
                    console.error('Error creating admins table:', err.message);
                    db.close();
                    reject(err);
                    return;
                }

                // Create default admin user if none exists
                db.get("SELECT COUNT(*) as count FROM admins", async (err, row) => {
                    if (err) {
                        db.close();
                        reject(err);
                        return;
                    }

                    if (row.count === 0) {
                        try {
                            const defaultPassword = 'admin123'; // Change this!
                            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                            
                            db.run("INSERT INTO admins (username, password_hash) VALUES (?, ?)", 
                                ['admin', hashedPassword], (err) => {
                                if (err) {
                                    console.error('Error creating default admin:', err.message);
                                    db.close();
                                    reject(err);
                                } else {
                                    console.log('✅ Default admin user created - Username: admin, Password: admin123');
                                    console.log('⚠️  Please change the default password after first login!');
                                    
                                    // Create trigger after admin user is created
                                    db.run(`
                                        CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
                                        AFTER UPDATE ON projects
                                        FOR EACH ROW
                                        BEGIN
                                            UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                                        END
                                    `, (err) => {
                                        db.close();
                                        if (err) {
                                            console.error('Error creating trigger:', err.message);
                                            reject(err);
                                        } else {
                                            resolve();
                                        }
                                    });
                                }
                            });
                        } catch (hashError) {
                            db.close();
                            reject(hashError);
                        }
                    } else {
                        // Create trigger if admin already exists
                        db.run(`
                            CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
                            AFTER UPDATE ON projects
                            FOR EACH ROW
                            BEGIN
                                UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                            END
                        `, (err) => {
                            db.close();
                            if (err) {
                                console.error('Error creating trigger:', err.message);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            });
        });
    });
}

// Projects CRUD operations
const projectsDB = {
    // Get all projects
    getAll: () => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.all("SELECT * FROM projects ORDER BY created_at DESC", (err, rows) => {
                if (err) reject(err);
                else {
                    // Parse JSON fields
                    const projects = rows.map(project => ({
                        ...project,
                        links: project.links ? JSON.parse(project.links) : [],
                        coordinates: project.coordinates ? JSON.parse(project.coordinates) : {}
                    }));
                    resolve(projects);
                }
                db.close();
            });
        });
    },

    // Get project by ID
    getById: (id) => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                else if (row) {
                    const project = {
                        ...row,
                        links: row.links ? JSON.parse(row.links) : [],
                        coordinates: row.coordinates ? JSON.parse(row.coordinates) : {}
                    };
                    resolve(project);
                } else {
                    resolve(null);
                }
                db.close();
            });
        });
    },

    // Create new project
    create: (projectData) => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const { title, description, image_url, video_url, links, coordinates } = projectData;
            
            db.run(`
                INSERT INTO projects (title, description, image_url, video_url, links, coordinates)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                title,
                description || '',
                image_url || '',
                video_url || '',
                JSON.stringify(links || []),
                JSON.stringify(coordinates || {})
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
                db.close();
            });
        });
    },

    // Update project
    update: (id, projectData) => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const { title, description, image_url, video_url, links, coordinates } = projectData;
            
            db.run(`
                UPDATE projects 
                SET title = ?, description = ?, image_url = ?, video_url = ?, links = ?, coordinates = ?
                WHERE id = ?
            `, [
                title,
                description || '',
                image_url || '',
                video_url || '',
                JSON.stringify(links || []),
                JSON.stringify(coordinates || {}),
                id
            ], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
                db.close();
            });
        });
    },

    // Delete project
    delete: (id) => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.run("DELETE FROM projects WHERE id = ?", [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
                db.close();
            });
        });
    }
};

// Admin operations
const adminsDB = {
    // Get admin by username
    getByUsername: (username) => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.get("SELECT * FROM admins WHERE username = ?", [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
                db.close();
            });
        });
    },

    // Update admin password
    updatePassword: (username, newPasswordHash) => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.run("UPDATE admins SET password_hash = ? WHERE username = ?", 
                [newPasswordHash, username], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
                db.close();
            });
        });
    }
};

// Generate projects.json file for frontend
async function generateProjectsJSON() {
    try {
        const projects = await projectsDB.getAll();
        
        // Convert to format expected by frontend
        const projectsData = projects.map(project => ({
            id: project.id.toString(),
            title: project.title,
            description: project.description,
            links: project.links,
            region: project.coordinates,
            image_url: project.image_url,
            video_url: project.video_url
        }));

        const outputPath = path.join(__dirname, '..', '..', 'data', 'projects.json');
        fs.writeFileSync(outputPath, JSON.stringify(projectsData, null, 2));
        console.log('📄 Generated projects.json');
        
        return projectsData;
    } catch (error) {
        console.error('Error generating projects.json:', error);
        throw error;
    }
}

module.exports = {
    initializeDatabase,
    projectsDB,
    adminsDB,
    generateProjectsJSON
};