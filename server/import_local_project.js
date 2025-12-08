import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const SOURCE_DIR = 'C:\\Users\\Admin\\Downloads\\mern_todo';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const fileSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    name: String,
    language: String,
    content: String,
}, { timestamps: true });

// Compound index to ensure unique file names per project matches actual schema
fileSchema.index({ projectId: 1, name: 1 }, { unique: true });

const projectSchema = new mongoose.Schema({
    name: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);
const Project = mongoose.model('Project', projectSchema);

const LANGUAGE_MAP = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.md': 'markdown',
    '.py': 'python',
    '.java': 'java',
};

function getLanguage(filename) {
    const ext = path.extname(filename);
    return LANGUAGE_MAP[ext] || 'plaintext';
}

async function walkDir(dir, fileList = [], rootDir = SOURCE_DIR) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Skip node_modules and .git
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;

        if (stat.isDirectory()) {
            await walkDir(filePath, fileList, rootDir);
        } else {
            // Get relative path for name
            const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
            const content = fs.readFileSync(filePath, 'utf8');
            fileList.push({
                name: relativePath,
                content,
                language: getLanguage(file)
            });
        }
    }
    return fileList;
}

const importProject = async () => {
    await connectDB();

    // 1. Find the target project (latest one)
    const project = await Project.findOne().sort({ updatedAt: -1 });
    if (!project) {
        console.log('No project found to import into.');
        process.exit(1);
    }
    console.log(`Importing into Project: ${project.name} (${project._id})`);

    // 2. Read local files
    console.log(`Reading files from ${SOURCE_DIR}...`);
    let filesToImport = [];
    try {
        filesToImport = await walkDir(SOURCE_DIR);
    } catch (e) {
        console.error('Error reading directory:', e.message);
        process.exit(1);
    }
    console.log(`Found ${filesToImport.length} files.`);

    // 3. Insert into DB
    let importedCount = 0;
    for (const fileData of filesToImport) {
        try {
            // Upsert: Update if exists, Insert if new
            await File.findOneAndUpdate(
                { projectId: project._id, name: fileData.name },
                {
                    projectId: project._id,
                    name: fileData.name,
                    content: fileData.content,
                    language: fileData.language
                },
                { upsert: true, new: true }
            );
            console.log(`Imported: ${fileData.name}`);
            importedCount++;
        } catch (e) {
            console.error(`Failed to import ${fileData.name}: ${e.message}`);
        }
    }

    console.log(`Successfully imported ${importedCount} files.`);
    process.exit(0);
};

importProject();
