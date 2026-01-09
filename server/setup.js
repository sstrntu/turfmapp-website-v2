const { initializeDatabase, projectsDB, generateProjectsJSON } = require('./models/database');
const path = require('path');
const fs = require('fs');

async function migrateExistingProjects() {
    console.log('🔄 Migrating existing projects from index.html...');
    
    try {
        // Read the existing index.html to extract project data
        const indexPath = path.join(__dirname, '..', 'index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Extract the projectsData array from the JavaScript
        const match = indexContent.match(/const projectsData = \[([\s\S]*?)\];/);
        
        if (match) {
            // This is a simplified extraction - you might need to adjust based on your actual data
            const projectsString = 'const projectsData = [' + match[1] + '];';
            
            // Evaluate the JavaScript to get the actual data
            // Note: This is not ideal in production, but works for migration
            const projectsData = eval(projectsString.replace('const projectsData = ', ''));
            
            console.log(`📊 Found ${projectsData.length} projects to migrate`);
            
            for (const project of projectsData) {
                await projectsDB.create({
                    title: project.title,
                    description: project.description,
                    image_url: '',
                    video_url: '',
                    links: project.links || [],
                    coordinates: project.region || {}
                });
                
                console.log(`✅ Migrated: ${project.title}`);
            }
            
            // Generate projects.json file
            await generateProjectsJSON();
            console.log('📄 Generated projects.json file');
        } else {
            console.log('⚠️  No project data found in index.html');
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('💡 You can add projects manually through the admin interface');
    }
}

async function setupCMS() {
    console.log('🚀 Setting up Portfolio CMS...\n');
    
    try {
        // Initialize database
        console.log('📦 Initializing database...');
        await initializeDatabase();
        console.log('✅ Database initialized successfully\n');
        
        // Check if projects already exist
        const existingProjects = await projectsDB.getAll();
        
        if (existingProjects.length === 0) {
            await migrateExistingProjects();
        } else {
            console.log(`📊 Database already contains ${existingProjects.length} projects`);
            await generateProjectsJSON();
        }
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Run: npm install');
        console.log('2. Start server: npm start');
        console.log('3. Visit: http://localhost:3000/admin');
        console.log('4. Login with: admin / admin123');
        console.log('5. Change your password after first login!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

// Run setup if called directly
if (require.main === module) {
    setupCMS();
}

module.exports = { setupCMS, migrateExistingProjects };