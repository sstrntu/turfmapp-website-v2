# Portfolio CMS System

A complete Content Management System for your interactive portfolio with parallax effects and tooltip management.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
npm run setup
```

### 3. Start Server
```bash
npm start
```

### 4. Access Admin Panel
- **Admin Panel**: http://localhost:3000/admin
- **Portfolio**: http://localhost:3000
- **Default Login**: 
  - Username: `admin`
  - Password: `admin123`

⚠️ **Important**: Change the default password after first login!

## 📱 Features

### Admin Dashboard
- **Project Management**: Create, edit, delete projects
- **Media Upload**: Images and videos with automatic optimization
- **Coordinate Picker**: Interactive hotspot positioning
- **Bulk Operations**: Import/export, bulk delete
- **Search & Filter**: Find projects quickly
- **Statistics**: Overview of your portfolio

### Portfolio Integration
- **Dynamic Loading**: Projects load from database
- **Real-time Updates**: Changes reflect immediately
- **Responsive Design**: Works on all devices
- **Performance Optimized**: Image compression and caching

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/status` - Check auth status
- `POST /api/auth/change-password` - Change password

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/export/json` - Export projects
- `POST /api/projects/import/json` - Import projects

### File Upload
- `POST /api/upload/image` - Upload image
- `POST /api/upload/video` - Upload video
- `POST /api/upload/multiple` - Upload multiple files
- `GET /api/upload/files/:type` - List uploaded files
- `DELETE /api/upload/file/:type/:filename` - Delete file

## 📁 Project Structure

```
/
├── server/                 # Backend server
│   ├── app.js             # Main server file
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── middleware/        # Auth middleware
│   └── setup.js           # Setup script
├── admin/                 # Admin interface
│   ├── index.html         # Login page
│   ├── dashboard.html     # Project management
│   └── editor.html        # Project editor
├── uploads/               # Uploaded media
│   ├── images/           # Image files
│   └── videos/           # Video files
├── data/                  # Data storage
│   ├── projects.db       # SQLite database
│   └── projects.json     # Generated JSON
└── index.html            # Main portfolio
```

## 🎨 Managing Projects

### Creating Projects
1. Go to Admin Dashboard
2. Click "New Project"
3. Fill in project details:
   - **Title**: Project name
   - **Description**: Project description
   - **Links**: External links (GitHub, demo, etc.)
   - **Media**: Upload images/videos
   - **Position**: Click on map to set hotspot location

### Coordinate System
- Uses normalized coordinates (0-1)
- `x`: Horizontal position (0 = left, 1 = right)
- `y`: Vertical position (0 = top, 1 = bottom)
- `w`: Width of hotspot area
- `h`: Height of hotspot area

### Media Management
- **Supported Formats**:
  - Images: JPEG, PNG, WebP, GIF
  - Videos: MP4, WebM, OGG, AVI, MOV
- **Automatic Optimization**:
  - Images resized to 1920px max width
  - WebP conversion for better performance
  - Thumbnail generation
- **File Limits**:
  - Maximum file size: 50MB
  - Maximum files per upload: 5

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000                    # Server port
NODE_ENV=development         # Environment
```

### Database
- Uses SQLite for simplicity
- Database file: `data/projects.db`
- Automatic backups recommended for production

### Security
- Session-based authentication
- Password hashing with bcrypt
- File upload validation
- CORS protection

## 🚀 Production Deployment

### 1. Environment Setup
```bash
NODE_ENV=production
```

### 2. Security Updates
- Change default admin password
- Update session secret in `server/app.js`
- Enable HTTPS
- Set secure cookie options

### 3. File Storage
Consider using cloud storage (AWS S3, Cloudinary) for production:
- Update upload routes
- Modify file URLs in projects
- Implement CDN for better performance

## 🔍 Troubleshooting

### Common Issues

**Database Error**
- Check file permissions in `data/` folder
- Run `npm run setup` to reinitialize

**Upload Failures**
- Check `uploads/` folder permissions
- Verify file size and format

**Login Problems**
- Clear browser cookies
- Check server logs for errors

### Development Mode
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Logs
Server logs show:
- Authentication attempts
- File uploads
- Database operations
- API requests

## 📊 Backup & Recovery

### Backup
```bash
# Database backup
cp data/projects.db data/projects.db.backup

# Media backup
tar -czf uploads-backup.tar.gz uploads/
```

### Recovery
```bash
# Restore database
cp data/projects.db.backup data/projects.db

# Restore media
tar -xzf uploads-backup.tar.gz
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Need help?** Check the server logs or create an issue for support.