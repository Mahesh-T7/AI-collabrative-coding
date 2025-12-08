import express from 'express';
import {
    getProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    importProject,
    importLocalProject
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getProjects).post(protect, createProject);
router.route('/import/github').post(protect, importProject);
router.route('/import/local').post(protect, importLocalProject);

router
    .route('/:id')
    .get(protect, getProject)
    .put(protect, updateProject)
    .delete(protect, deleteProject);

export default router;
