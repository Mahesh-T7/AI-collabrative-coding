import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

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
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
    name: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);
const Project = mongoose.model('Project', projectSchema);

const inspect = async () => {
    await connectDB();

    // Find latest project
    const project = await Project.findOne().sort({ updatedAt: -1 });

    if (!project) {
        console.log('No projects found.');
        process.exit(0);
    }

    console.log(`Latest Project: ${project.name} (ID: ${project._id})`);

    // Find files
    const files = await File.find({ projectId: project._id }).sort({ name: 1 });

    console.log(`Found ${files.length} files:`);
    files.forEach(f => {
        console.log(` - ${f.name} (${f.language})`);
    });

    process.exit(0);
};

inspect();
