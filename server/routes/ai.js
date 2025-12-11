import express from 'express';
import {
    generateCompletion,
    explainCode,
    detectBugs,
    suggestRefactoring,
    chatWithAI,
    fixError,
    fixTerminal,
    runAgent
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All AI routes require authentication
router.post('/complete', protect, generateCompletion);
router.post('/explain', protect, explainCode);
router.post('/bugs', protect, detectBugs);
router.post('/refactor', protect, suggestRefactoring);
router.post('/fix-error', protect, fixError);
router.post('/fix-terminal', protect, fixTerminal);
router.post('/chat', protect, chatWithAI);
router.post('/agent', protect, runAgent);

export default router;
