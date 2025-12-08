import express from 'express';
import {
    generateCompletion,
    explainCode,
    detectBugs,
    suggestRefactoring,
    chatWithAI,
    fixError,
} from '../controllers/aiController.js';

const router = express.Router();

// Public AI routes (no auth required)
// These repurpose the existing controllers but are mounted on a path that skips the protect middleware
router.post('/ai/complete', generateCompletion);
router.post('/ai/explain', explainCode);
router.post('/ai/bugs', detectBugs);
router.post('/ai/refactor', suggestRefactoring);
router.post('/ai/fix-error', fixError);
router.post('/ai/chat', chatWithAI);

export default router;
