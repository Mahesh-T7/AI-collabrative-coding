import express from 'express';
import { getProjectActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:projectId', protect, getProjectActivity);

export default router;
