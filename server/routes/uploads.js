const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        if (file.mimetype.startsWith('image/')) {
            uploadPath = path.join(__dirname, '..', '..', 'uploads', 'images');
        } else if (file.mimetype.startsWith('video/')) {
            uploadPath = path.join(__dirname, '..', '..', 'uploads', 'videos');
        } else {
            return cb(new Error('Invalid file type'));
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
};

// Configure multer with limits
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 5 // Maximum 5 files per upload
    }
});

// Image upload endpoint
router.post('/image', requireAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please select an image file to upload'
            });
        }

        const originalPath = req.file.path;
        const filename = req.file.filename;
        const fileExt = path.extname(filename);
        
        // Create optimized versions
        const optimizedFilename = filename.replace(fileExt, '-optimized.webp');
        const thumbnailFilename = filename.replace(fileExt, '-thumb.webp');
        
        const optimizedPath = path.join(req.file.destination, optimizedFilename);
        const thumbnailPath = path.join(req.file.destination, thumbnailFilename);

        try {
            // Create optimized version (max 1920px width, 80% quality)
            await sharp(originalPath)
                .resize(1920, null, { 
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .webp({ quality: 80 })
                .toFile(optimizedPath);

            // Create thumbnail (300px width)
            await sharp(originalPath)
                .resize(300, 200, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({ quality: 70 })
                .toFile(thumbnailPath);

        } catch (sharpError) {
            console.error('Image processing error:', sharpError);
            // Continue without optimized versions if processing fails
        }

        const baseUrl = `/uploads/images/`;
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                original: {
                    filename: filename,
                    url: baseUrl + filename,
                    size: req.file.size
                },
                optimized: fs.existsSync(optimizedPath) ? {
                    filename: optimizedFilename,
                    url: baseUrl + optimizedFilename
                } : null,
                thumbnail: fs.existsSync(thumbnailPath) ? {
                    filename: thumbnailFilename,
                    url: baseUrl + thumbnailFilename
                } : null
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Upload failed',
            message: 'An error occurred while uploading the image'
        });
    }
});

// Video upload endpoint
router.post('/video', requireAuth, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please select a video file to upload'
            });
        }

        const baseUrl = `/uploads/videos/`;
        
        res.json({
            success: true,
            message: 'Video uploaded successfully',
            data: {
                filename: req.file.filename,
                url: baseUrl + req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });

    } catch (error) {
        console.error('Video upload error:', error);
        res.status(500).json({
            error: 'Upload failed',
            message: 'An error occurred while uploading the video'
        });
    }
});

// Multiple files upload
router.post('/multiple', requireAuth, upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No files uploaded',
                message: 'Please select files to upload'
            });
        }

        const uploadedFiles = [];

        for (const file of req.files) {
            const baseUrl = file.mimetype.startsWith('image/') 
                ? `/uploads/images/` 
                : `/uploads/videos/`;

            let fileData = {
                original: {
                    filename: file.filename,
                    url: baseUrl + file.filename,
                    size: file.size,
                    mimetype: file.mimetype
                }
            };

            // Process images
            if (file.mimetype.startsWith('image/')) {
                try {
                    const originalPath = file.path;
                    const filename = file.filename;
                    const fileExt = path.extname(filename);
                    
                    const optimizedFilename = filename.replace(fileExt, '-optimized.webp');
                    const thumbnailFilename = filename.replace(fileExt, '-thumb.webp');
                    
                    const optimizedPath = path.join(file.destination, optimizedFilename);
                    const thumbnailPath = path.join(file.destination, thumbnailFilename);

                    // Create optimized version
                    await sharp(originalPath)
                        .resize(1920, null, { 
                            withoutEnlargement: true,
                            fit: 'inside'
                        })
                        .webp({ quality: 80 })
                        .toFile(optimizedPath);

                    // Create thumbnail
                    await sharp(originalPath)
                        .resize(300, 200, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .webp({ quality: 70 })
                        .toFile(thumbnailPath);

                    fileData.optimized = {
                        filename: optimizedFilename,
                        url: baseUrl + optimizedFilename
                    };
                    
                    fileData.thumbnail = {
                        filename: thumbnailFilename,
                        url: baseUrl + thumbnailFilename
                    };

                } catch (sharpError) {
                    console.error('Image processing error for', file.filename, ':', sharpError);
                }
            }

            uploadedFiles.push(fileData);
        }

        res.json({
            success: true,
            message: `Successfully uploaded ${req.files.length} file(s)`,
            data: uploadedFiles
        });

    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({
            error: 'Upload failed',
            message: 'An error occurred while uploading files'
        });
    }
});

// Delete uploaded file
router.delete('/file/:type/:filename', requireAuth, (req, res) => {
    try {
        const { type, filename } = req.params;
        
        if (!['images', 'videos'].includes(type)) {
            return res.status(400).json({
                error: 'Invalid file type',
                message: 'File type must be either images or videos'
            });
        }

        const filePath = path.join(__dirname, '..', '..', 'uploads', type, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'File not found',
                message: 'The specified file does not exist'
            });
        }

        // Delete main file
        fs.unlinkSync(filePath);

        // Delete related files (optimized, thumbnail) for images
        if (type === 'images') {
            const fileExt = path.extname(filename);
            const baseName = filename.replace(fileExt, '');
            
            const optimizedFile = path.join(__dirname, '..', '..', 'uploads', type, baseName + '-optimized.webp');
            const thumbnailFile = path.join(__dirname, '..', '..', 'uploads', type, baseName + '-thumb.webp');
            
            if (fs.existsSync(optimizedFile)) fs.unlinkSync(optimizedFile);
            if (fs.existsSync(thumbnailFile)) fs.unlinkSync(thumbnailFile);
        }

        res.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error) {
        console.error('File deletion error:', error);
        res.status(500).json({
            error: 'Deletion failed',
            message: 'An error occurred while deleting the file'
        });
    }
});

// List uploaded files
router.get('/files/:type', requireAuth, (req, res) => {
    try {
        const { type } = req.params;
        
        if (!['images', 'videos'].includes(type)) {
            return res.status(400).json({
                error: 'Invalid file type',
                message: 'File type must be either images or videos'
            });
        }

        const uploadsPath = path.join(__dirname, '..', '..', 'uploads', type);
        
        if (!fs.existsSync(uploadsPath)) {
            return res.json({
                success: true,
                data: []
            });
        }

        const files = fs.readdirSync(uploadsPath)
            .filter(file => {
                // Exclude optimized and thumbnail versions from listing
                return !file.includes('-optimized') && !file.includes('-thumb');
            })
            .map(filename => {
                const filePath = path.join(uploadsPath, filename);
                const stats = fs.statSync(filePath);
                
                return {
                    filename,
                    url: `/uploads/${type}/${filename}`,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created));

        res.json({
            success: true,
            data: files
        });

    } catch (error) {
        console.error('File listing error:', error);
        res.status(500).json({
            error: 'Failed to list files',
            message: 'An error occurred while listing files'
        });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'File size exceeds 50MB limit'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files',
                message: 'Maximum 5 files allowed per upload'
            });
        }
    }
    
    res.status(400).json({
        error: 'Upload error',
        message: error.message || 'An error occurred during upload'
    });
});

module.exports = router;