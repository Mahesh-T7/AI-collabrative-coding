import express from 'express';
import {
    getFiles,
    createFile,
    getFile,
    updateFile,
    deleteFile,
    saveToDisk,
    syncProject
} from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/:projectId').get(protect, getFiles);
router.route('/').post(protect, createFile);
router
    .route('/file/:id')
    .get(protect, getFile)
    .put(protect, updateFile)
    .delete(protect, deleteFile);

router.post('/disk', protect, saveToDisk);
router.post('/sync/:projectId', protect, syncProject);

export default router;
