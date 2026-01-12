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
                    // Parse JSON fields and detect format
                    const projects = rows.map(project => {
                        const parsedLinks = project.links ? JSON.parse(project.links) : [];
                        const coordinates = project.coordinates ? JSON.parse(project.coordinates) : {};

                        // Check if this is a tooltip format (projects array stored in links field)
                        if (Array.isArray(parsedLinks) && parsedLinks.length > 0 && parsedLinks[0].title) {
                            // This is a tooltip format
                            // Add default 'under' field for backward compatibility
                            const projectsWithDefaults = parsedLinks.map(p => ({
                                ...p,
                                under: p.under || 'Turfmapp'
                            }));

                            return {
                                id: project.id,
                                name: project.title, // Tooltip name stored in title field
                                projects: projectsWithDefaults, // Projects array stored in links field
                                coordinates: coordinates,
                                created_at: project.created_at,
                                updated_at: project.updated_at
                            };
                        } else {
                            // This is legacy single project format
                            return {
                                ...project,
                                links: parsedLinks,
                                coordinates: coordinates
                            };
                        }
                    });
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
                    const parsedLinks = row.links ? JSON.parse(row.links) : [];
                    const coordinates = row.coordinates ? JSON.parse(row.coordinates) : {};

                    // Check if this is a tooltip format (projects array stored in links field)
                    if (Array.isArray(parsedLinks) && parsedLinks.length > 0 && parsedLinks[0].title) {
                        // This is a tooltip format
                        // Add default 'under' field for backward compatibility
                        const projectsWithDefaults = parsedLinks.map(p => ({
                            ...p,
                            under: p.under || 'Turfmapp'
                        }));

                        const project = {
                            id: row.id,
                            name: row.title, // Tooltip name stored in title field
                            projects: projectsWithDefaults, // Projects array stored in links field
                            coordinates: coordinates,
                            created_at: row.created_at,
                            updated_at: row.updated_at
                        };
                        resolve(project);
                    } else {
                        // This is legacy single project format
                        const project = {
                            ...row,
                            links: parsedLinks,
                            coordinates: coordinates
                        };
                        resolve(project);
                    }
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
            
            // Check if this is the new tooltip format
            if (projectData.name && projectData.projects) {
                // New tooltip format - store as JSON in title field and add special fields
                const { name, projects, coordinates } = projectData;
                
                db.run(`
                    INSERT INTO projects (title, description, image_url, video_url, links, coordinates)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    name, // Store tooltip name in title field
                    '', // Empty description for tooltip format
                    '', // Empty image_url for tooltip format
                    '', // Empty video_url for tooltip format
                    JSON.stringify(projects), // Store projects array in links field
                    JSON.stringify(coordinates || {})
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                    db.close();
                });
            } else {
                // Legacy single project format
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
            }
        });
    },

    // Update project
    update: (id, projectData) => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            
            // Check if this is the new tooltip format
            if (projectData.name && projectData.projects) {
                // New tooltip format - store as JSON in title field and add special fields
                const { name, projects, coordinates } = projectData;
                
                db.run(`
                    UPDATE projects 
                    SET title = ?, description = ?, image_url = ?, video_url = ?, links = ?, coordinates = ?
                    WHERE id = ?
                `, [
                    name, // Store tooltip name in title field
                    '', // Empty description for tooltip format
                    '', // Empty image_url for tooltip format
                    '', // Empty video_url for tooltip format
                    JSON.stringify(projects), // Store projects array in links field
                    JSON.stringify(coordinates || {}),
                    id
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                    db.close();
                });
            } else {
                // Legacy single project format
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
            }
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
        
        // Convert to format expected by frontend, preserving both tooltip and legacy formats
        const projectsData = projects.map(item => {
            if (item.projects && Array.isArray(item.projects)) {
                // This is a tooltip format - preserve the structure
                return {
                    id: item.id.toString(),
                    name: item.name,
                    projects: item.projects,
                    region: item.coordinates
                };
            } else {
                // This is a legacy single project format
                return {
                    id: item.id.toString(),
                    title: item.title,
                    description: item.description,
                    links: item.links,
                    region: item.coordinates,
                    image_url: item.image_url,
                    video_url: item.video_url
                };
            }
        });

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