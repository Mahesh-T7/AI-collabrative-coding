import aiService from '../services/aiService.js';

// @desc    Generate code completion
// @route   POST /api/ai/complete
// @access  Private
export const generateCompletion = async (req, res) => {
    try {
        const { code, language, cursorPosition } = req.body;

        if (!code || !language) {
            return res.status(400).json({ message: 'Code and language are required' });
        }

        const completion = await aiService.generateCompletion(code, language, cursorPosition);

        res.json({
            completion,
            success: true
        });
    } catch (error) {
        console.error('Completion error:', error);
        res.status(500).json({
            message: error.message || 'Failed to generate completion',
            success: false
        });
    }
};

// @desc    Explain code
// @route   POST /api/ai/explain
// @access  Private
export const explainCode = async (req, res) => {
    try {
        const { code, language, files } = req.body;

        if (!code || !language) {
            return res.status(400).json({ message: 'Code and language are required' });
        }

        const explanation = await aiService.explainCode(code, language, files);

        res.json({
            explanation,
            success: true
        });
    } catch (error) {
        console.error('Explanation error:', error);
        res.status(500).json({
            message: error.message || 'Failed to explain code',
            success: false
        });
    }
};

// @desc    Detect bugs in code
// @route   POST /api/ai/bugs
// @access  Private
export const detectBugs = async (req, res) => {
    try {
        const { code, language, files } = req.body;

        if (!code || !language) {
            return res.status(400).json({ message: 'Code and language are required' });
        }

        const analysis = await aiService.detectBugs(code, language, files);

        res.json({
            ...analysis,
            success: true
        });
    } catch (error) {
        console.error('Bug detection error:', error);
        res.status(500).json({
            message: error.message || 'Failed to detect bugs',
            success: false
        });
    }
};

// @desc    Suggest code refactoring
// @route   POST /api/ai/refactor
// @access  Private
export const suggestRefactoring = async (req, res) => {
    try {
        const { code, language, files } = req.body;

        if (!code || !language) {
            return res.status(400).json({ message: 'Code and language are required' });
        }

        const suggestions = await aiService.suggestRefactoring(code, language, files);

        res.json({
            ...suggestions,
            success: true
        });
    } catch (error) {
        console.error('Refactoring error:', error);
        res.status(500).json({
            message: error.message || 'Failed to suggest refactoring',
            success: false
        });
    }
};

// @desc    Fix error in code
// @route   POST /api/ai/fix-error
// @access  Private
export const fixError = async (req, res) => {
    try {
        const { code, errorLog, language } = req.body;

        if (!code || !errorLog) {
            return res.status(400).json({ message: 'Code and error log are required' });
        }

        const fix = await aiService.fixError(code, errorLog, language);

        res.json({
            ...fix,
            success: true
        });
    } catch (error) {
        console.error('Fix error:', error);
        res.status(500).json({
            message: error.message || 'Failed to fix error',
            success: false
        });
    }
};

// @desc    Fix terminal error
// @route   POST /api/ai/fix-terminal
// @access  Private
export const fixTerminal = async (req, res) => {
    try {
        const { errorLog } = req.body;

        if (!errorLog) {
            return res.status(400).json({ message: 'Error log is required' });
        }

        const fix = await aiService.fixTerminalError(errorLog);

        res.json({
            ...fix,
            success: true
        });
    } catch (error) {
        console.error('Terminal fix error:', error);
        res.status(500).json({
            message: error.message || 'Failed to fix terminal error',
            success: false
        });
    }
};

// @desc    Run Agentic AI
// @route   POST /api/ai/agent
// @access  Private
export const runAgent = async (req, res) => {
    try {
        const { prompt, projectId } = req.body;

        if (!prompt || !projectId) {
            return res.status(400).json({ message: 'Prompt and Project ID are required' });
        }

        // Import dynamically to avoid circular issues if any, or just import at top if clean
        const { default: agentService } = await import('../services/agentService.js');

        const result = await agentService.runAgent(prompt, projectId);

        res.json({
            ...result,
            success: true
        });
    } catch (error) {
        console.error('Agent error:', error);
        res.status(500).json({
            message: error.message || 'Failed to run agent',
            success: false
        });
    }
};

export const chatWithAI = async (req, res) => {
    try {
        const { message, codeContext, conversationHistory, files } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const response = await aiService.chatWithAI(
            message,
            codeContext || '',
            conversationHistory || [],
            files || []
        );

        res.json({
            response,
            success: true
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            message: error.message || 'Failed to chat with AI',
            success: false
        });
    }
};
