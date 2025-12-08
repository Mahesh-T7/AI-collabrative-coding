import File from '../models/File.js';
import Project from '../models/Project.js';
import ActivityLog from '../models/ActivityLog.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// @desc    Get all files in a project
// @route   GET /api/files/:projectId
// @access  Private
const getFiles = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project ownership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const files = await File.find({ projectId }).sort({ name: 1 });
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new file
// @route   POST /api/files
// @access  Private
const createFile = async (req, res) => {
    try {
        const { projectId, name, language } = req.body;

        // Verify project ownership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const file = await File.create({
            projectId,
            name,
            language: language || 'javascript',
            content: '',
        });

        // Log activity
        await ActivityLog.create({
            projectId,
            userId: req.user._id,
            action: 'CREATE_FILE',
            details: `Created file ${name}`,
        });

        res.status(201).json(file);
    } catch (error) {
        console.error('Error creating file:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'File with this name already exists in the project' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single file
// @route   GET /api/files/file/:id
// @access  Private
const getFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Verify project ownership
        const project = await Project.findById(file.projectId);
        if (project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(file);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update file
// @route   PUT /api/files/:id
// @access  Private
const updateFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Verify project ownership
        const project = await Project.findById(file.projectId);
        if (project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        file.content = req.body.content !== undefined ? req.body.content : file.content;
        file.name = req.body.name || file.name;
        file.language = req.body.language || file.language;

        const updatedFile = await file.save();

        // Log activity
        await ActivityLog.create({
            projectId: file.projectId,
            userId: req.user._id,
            action: 'UPDATE_FILE',
            details: `Updated file ${updatedFile.name}`,
        });

        res.json(updatedFile);
    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Verify project ownership
        const project = await Project.findById(file.projectId);
        if (project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await file.deleteOne();

        // Log activity
        await ActivityLog.create({
            projectId: file.projectId,
            userId: req.user._id,
            action: 'DELETE_FILE',
            details: `Deleted file ${file.name}`,
        });

        res.json({ message: 'File removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Save file to disk for execution
// @route   POST /api/files/disk
// @access  Private
const saveToDisk = async (req, res) => {
    try {
        const { projectId, filename, content } = req.body;

        if (!projectId || !filename || content === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get current directory
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // Create temp directory path
        const tempDir = path.join(__dirname, '../../temp', projectId);

        // Create directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Write file to disk
        const filePath = path.join(tempDir, filename);
        fs.writeFileSync(filePath, content, 'utf8');

        res.json({
            message: 'File saved to disk successfully',
            path: filePath
        });
    } catch (error) {
        console.error('Error saving file to disk:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Sync all project files to disk for terminal execution
// @route   POST /api/files/sync/:projectId
// @access  Private
const syncProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project ownership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const files = await File.find({ projectId });

        // Get temp dir
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const tempDir = path.join(__dirname, '../../temp', projectId);

        // Ensure temp dir exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Write all files
        for (const file of files) {
            const filePath = path.join(tempDir, file.name);
            const dirName = path.dirname(filePath);

            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true });
            }

            fs.writeFileSync(filePath, file.content, 'utf8');
        }

        res.json({ message: `Synced ${files.length} files to disk`, path: tempDir });
    } catch (error) {
        console.error('Error syncing project:', error);
        res.status(500).json({ message: error.message });
    }
};

export { getFiles, createFile, getFile, updateFile, deleteFile, saveToDisk, syncProject };
