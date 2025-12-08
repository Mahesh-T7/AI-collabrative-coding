import Project from '../models/Project.js';
import File from '../models/File.js';
import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all user projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            $or: [{ ownerId: req.user._id }, { members: req.user._id }],
        })
            .sort({ updatedAt: -1 })
            .populate('ownerId', 'username email avatarUrl')
            .populate('members', 'username email avatarUrl');
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
    try {
        const { name } = req.body;

        const project = await Project.create({
            name,
            ownerId: req.user._id,
        });

        // Create default main.js file
        await File.create({
            projectId: project._id,
            name: 'main.js',
            language: 'javascript',
            content: '// Welcome to your new project!\nconsole.log("Hello, World!");',
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('ownerId', 'username email avatarUrl')
            .populate('members', 'username email avatarUrl');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check ownership or membership
        const isOwner = project.ownerId._id.toString() === req.user._id.toString();
        const isMember = project.members.some(
            (member) => member._id.toString() === req.user._id.toString()
        );

        if (!isOwner && !isMember) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check ownership
        if (project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        project.name = req.body.name || project.name;
        const updatedProject = await project.save();

        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check ownership
        if (project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete all files in project
        await File.deleteMany({ projectId: project._id });

        // Delete project
        await project.deleteOne();

        res.json({ message: 'Project removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Import project from GitHub
// @route   POST /api/projects/import/github
// @access  Private
const importProject = async (req, res) => {
    const { repoUrl, name } = req.body;
    const tempDir = path.join(__dirname, '../../temp', `import-${Date.now()}`);

    try {
        if (!repoUrl) {
            return res.status(400).json({ message: 'Repository URL is required' });
        }

        // Create temp directory
        await fs.ensureDir(tempDir);

        // Clone repository
        const git = simpleGit();
        await git.clone(repoUrl, tempDir);

        // Determine project name
        const projectName = name || repoUrl.split('/').pop().replace('.git', '');

        // Create Project
        const project = await Project.create({
            name: projectName,
            ownerId: req.user._id,
        });

        // Helper to recursively read files
        const readFiles = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(tempDir, fullPath);

                // Skip .git and node_modules
                if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'package-lock.json' || entry.name === 'yarn.lock') {
                    continue;
                }

                if (entry.isDirectory()) {
                    await readFiles(fullPath);
                } else {
                    // Only import text files (simple check)
                    // In a real app, use a library to detect binary files
                    const ext = path.extname(entry.name).toLowerCase();
                    const validExts = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md', '.txt', '.py', '.java', '.c', '.cpp', '.h', '.go', '.rs', '.php', '.rb'];

                    if (validExts.includes(ext)) {
                        const content = await fs.readFile(fullPath, 'utf8');

                        // Determine language
                        let language = 'plaintext';
                        if (['.js', '.jsx'].includes(ext)) language = 'javascript';
                        else if (['.ts', '.tsx'].includes(ext)) language = 'typescript';
                        else if (ext === '.html') language = 'html';
                        else if (ext === '.css') language = 'css';
                        else if (ext === '.json') language = 'json';
                        else if (ext === '.py') language = 'python';

                        await File.create({
                            projectId: project._id,
                            name: relativePath.replace(/\\/g, '/'), // Normalize paths
                            language,
                            content,
                        });
                    }
                }
            }
        };

        await readFiles(tempDir);

        // Cleanup
        await fs.remove(tempDir);

        res.status(201).json(project);

    } catch (error) {
        // Cleanup on error
        if (await fs.pathExists(tempDir)) {
            await fs.remove(tempDir);
        }
        console.error('Import error:', error);
        res.status(500).json({ message: 'Failed to import project: ' + error.message });
    }
};

// @desc    Import project from Local
// @route   POST /api/projects/import/local
// @access  Private
const importLocalProject = async (req, res) => {
    const { name, files } = req.body;

    try {
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ message: 'No files provided for import' });
        }

        // Create Project
        const project = await Project.create({
            name: name || 'Imported Project',
            ownerId: req.user._id,
        });

        // Insert files
        // Use Promise.all for better performance, but be mindful of rate limits/connections if array is huge
        // For local import, usually file count is reasonable
        const filePromises = files.map(file => {
            return File.create({
                projectId: project._id,
                name: file.name,
                language: file.language || 'plaintext',
                content: file.content || ''
            });
        });

        await Promise.all(filePromises);

        res.status(201).json(project);

    } catch (error) {
        console.error('Local import error:', error);
        res.status(500).json({ message: 'Failed to import project: ' + error.message });
    }
};

export { getProjects, createProject, getProject, updateProject, deleteProject, importProject, importLocalProject };
