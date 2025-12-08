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
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const fileSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    name: String,
    content: String,
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
    name: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);
const Project = mongoose.model('Project', projectSchema);

const run = async () => {
    await connectDB();
    const project = await Project.findOne().sort({ updatedAt: -1 });
    const file = await File.findOne({ projectId: project._id, name: 'main.js' });

    if (file) {
        console.log('--- CONTENT START ---');
        console.log(file.content);
        console.log('--- CONTENT END ---');
    } else {
        console.log('File main.js not found');
    }
    process.exit(0);
};

run();
