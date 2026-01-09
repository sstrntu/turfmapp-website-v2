const express = require('express');
const { projectsDB, generateProjectsJSON } = require('../models/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get all projects (public endpoint)
router.get('/', async (req, res) => {
    try {
        const projects = await projectsDB.getAll();
        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ 
            error: 'Failed to fetch projects',
            message: 'An error occurred while fetching projects'
        });
    }
});

// Get project by ID (public endpoint)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await projectsDB.getById(parseInt(id));
        
        if (!project) {
            return res.status(404).json({ 
                error: 'Project not found',
                message: 'The requested project does not exist'
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ 
            error: 'Failed to fetch project',
            message: 'An error occurred while fetching the project'
        });
    }
});

// Create new project (admin only)
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, description, image_url, video_url, links, coordinates } = req.body;

        if (!title) {
            return res.status(400).json({ 
                error: 'Missing title',
                message: 'Project title is required'
            });
        }

        // Validate coordinates if provided
        if (coordinates) {
            const { x, y, w, h } = coordinates;
            if (x < 0 || x > 1 || y < 0 || y > 1 || w < 0 || w > 1 || h < 0 || h > 1) {
                return res.status(400).json({ 
                    error: 'Invalid coordinates',
                    message: 'Coordinates must be between 0 and 1'
                });
            }
        }

        const projectId = await projectsDB.create({
            title,
            description,
            image_url,
            video_url,
            links: Array.isArray(links) ? links : [],
            coordinates: coordinates || {}
        });

        // Regenerate projects.json file
        await generateProjectsJSON();

        const newProject = await projectsDB.getById(projectId);
        
        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: newProject
        });

    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ 
            error: 'Failed to create project',
            message: 'An error occurred while creating the project'
        });
    }
});

// Update project (admin only)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, image_url, video_url, links, coordinates } = req.body;

        if (!title) {
            return res.status(400).json({ 
                error: 'Missing title',
                message: 'Project title is required'
            });
        }

        // Check if project exists
        const existingProject = await projectsDB.getById(parseInt(id));
        if (!existingProject) {
            return res.status(404).json({ 
                error: 'Project not found',
                message: 'The project to update does not exist'
            });
        }

        // Validate coordinates if provided
        if (coordinates) {
            const { x, y, w, h } = coordinates;
            if (x < 0 || x > 1 || y < 0 || y > 1 || w < 0 || w > 1 || h < 0 || h > 1) {
                return res.status(400).json({ 
                    error: 'Invalid coordinates',
                    message: 'Coordinates must be between 0 and 1'
                });
            }
        }

        const updatedRows = await projectsDB.update(parseInt(id), {
            title,
            description,
            image_url,
            video_url,
            links: Array.isArray(links) ? links : [],
            coordinates: coordinates || {}
        });

        if (updatedRows === 0) {
            return res.status(404).json({ 
                error: 'Project not found',
                message: 'The project to update does not exist'
            });
        }

        // Regenerate projects.json file
        await generateProjectsJSON();

        const updatedProject = await projectsDB.getById(parseInt(id));
        
        res.json({
            success: true,
            message: 'Project updated successfully',
            data: updatedProject
        });

    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ 
            error: 'Failed to update project',
            message: 'An error occurred while updating the project'
        });
    }
});

// Delete project (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if project exists
        const existingProject = await projectsDB.getById(parseInt(id));
        if (!existingProject) {
            return res.status(404).json({ 
                error: 'Project not found',
                message: 'The project to delete does not exist'
            });
        }

        const deletedRows = await projectsDB.delete(parseInt(id));

        if (deletedRows === 0) {
            return res.status(404).json({ 
                error: 'Project not found',
                message: 'The project to delete does not exist'
            });
        }

        // Regenerate projects.json file
        await generateProjectsJSON();
        
        res.json({
            success: true,
            message: 'Project deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ 
            error: 'Failed to delete project',
            message: 'An error occurred while deleting the project'
        });
    }
});

// Bulk operations (admin only)
router.post('/bulk/delete', requireAuth, async (req, res) => {
    try {
        const { projectIds } = req.body;

        if (!Array.isArray(projectIds) || projectIds.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid project IDs',
                message: 'Please provide an array of project IDs to delete'
            });
        }

        let deletedCount = 0;
        for (const id of projectIds) {
            try {
                const rows = await projectsDB.delete(parseInt(id));
                deletedCount += rows;
            } catch (err) {
                console.error(`Error deleting project ${id}:`, err);
            }
        }

        // Regenerate projects.json file
        await generateProjectsJSON();
        
        res.json({
            success: true,
            message: `Successfully deleted ${deletedCount} project(s)`,
            deletedCount
        });

    } catch (error) {
        console.error('Error bulk deleting projects:', error);
        res.status(500).json({ 
            error: 'Failed to delete projects',
            message: 'An error occurred while deleting projects'
        });
    }
});

// Export/Import projects (admin only)
router.get('/export/json', requireAuth, async (req, res) => {
    try {
        const projects = await projectsDB.getAll();
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=projects-export.json');
        res.json(projects);
        
    } catch (error) {
        console.error('Error exporting projects:', error);
        res.status(500).json({ 
            error: 'Failed to export projects',
            message: 'An error occurred while exporting projects'
        });
    }
});

router.post('/import/json', requireAuth, async (req, res) => {
    try {
        const { projects, overwrite = false } = req.body;

        if (!Array.isArray(projects)) {
            return res.status(400).json({ 
                error: 'Invalid data format',
                message: 'Please provide an array of projects to import'
            });
        }

        // If overwrite is true, clear existing projects
        if (overwrite) {
            const existingProjects = await projectsDB.getAll();
            for (const project of existingProjects) {
                await projectsDB.delete(project.id);
            }
        }

        let importedCount = 0;
        for (const project of projects) {
            try {
                await projectsDB.create({
                    title: project.title || 'Untitled Project',
                    description: project.description || '',
                    image_url: project.image_url || '',
                    video_url: project.video_url || '',
                    links: project.links || [],
                    coordinates: project.coordinates || {}
                });
                importedCount++;
            } catch (err) {
                console.error('Error importing project:', err);
            }
        }

        // Regenerate projects.json file
        await generateProjectsJSON();
        
        res.json({
            success: true,
            message: `Successfully imported ${importedCount} project(s)`,
            importedCount
        });

    } catch (error) {
        console.error('Error importing projects:', error);
        res.status(500).json({ 
            error: 'Failed to import projects',
            message: 'An error occurred while importing projects'
        });
    }
});

module.exports = router;