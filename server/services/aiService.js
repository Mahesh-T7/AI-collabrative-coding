import pkg from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
const { OpenAI } = pkg;
const openai = pkg.default || pkg;

class AIService {
    constructor() {
        this._openai = null;
        this._gemini = null;
        this.model = process.env.AI_MODEL || 'gpt-4o-mini';
        this.geminiModelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    }

    get openai() {
        if (!this._openai && process.env.OPENAI_API_KEY) {
            this._openai = new (OpenAI || openai)({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
        return this._openai;
    }

    get gemini() {
        // Check for GEMINI_API_KEY or fallback to VITE_GEMINI_API_KEY from .env
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!this._gemini && apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            this._gemini = genAI.getGenerativeModel({ model: this.geminiModelName });
        }
        return this._gemini;
    }

    get provider() {
        // Prioritize Gemini if available (in case OpenAI key is expired)
        if (this.gemini) return 'gemini';
        if (this.openai && this.model.startsWith('gpt')) return 'openai';
        if (this.openai) return 'openai'; // Fallback to OpenAI if available
        throw new Error('No AI provider configured. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your .env file.');
    }

    /**
     * Generate code completion suggestions
     * @param {string} code - Current code context
     * @param {string} language - Programming language
     * @param {number} cursorPosition - Cursor position in code
     * @returns {Promise<string>} - Completion suggestion
     */
    async generateCompletion(code, language, cursorPosition) {
        try {
            const prompt = `You are an expert ${language} programmer. Given the following code context, suggest the next line or completion. Only return the code suggestion, no explanations.

Current code:
\`\`\`${language}
${code}
\`\`\`

Provide a natural completion for the code at the cursor position. Return only the suggested code, nothing else.`;

            if (this.provider === 'gemini') {
                const result = await this.gemini.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                // Clean up markdown code blocks if present
                return text.replace(/^```\w*\s*/, '').replace(/\s*```$/, '').trim();
            }

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a code completion assistant. Provide concise, accurate code suggestions.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.3,
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('AI Completion Error:', error);
            throw new Error('Failed to generate code completion');
        }
    }

    /**
     * Explain code in natural language
     * @param {string} code - Code to explain
     * @param {string} language - Programming language
     * @returns {Promise<string>} - Code explanation
     */
    async explainCode(code, language, files = []) {
        try {
            let context = `Explain the following ${language} code in clear, concise terms. Focus on what it does and how it works.\n\n\`\`\`${language}\n${code}\n\`\`\``;

            if (files.length > 0) {
                context += '\n\nAdditional Project Context:\n';
                files.forEach(f => {
                    context += `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
                });
            }

            const prompt = context;

            if (this.provider === 'gemini') {
                // Prepend system instruction to prompt for Gemini (since system roles aren't always standard in same way)
                const geminiPrompt = `You are a helpful programming tutor. Explain code clearly and concisely. Use the provided project files for context if needed.\n\n${prompt}`;
                const result = await this.gemini.generateContent(geminiPrompt);
                const response = await result.response;
                return response.text();
            }

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful programming tutor. Explain code clearly and concisely. Use the provided project files for context if needed.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.5,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('AI Explanation Error:', error);
            throw new Error('Failed to explain code');
        }
    }

    /**
     * Detect bugs and suggest fixes
     * @param {string} code - Code to analyze
     * @param {string} language - Programming language
     * @returns {Promise<object>} - Bug analysis and fixes
     */
    async detectBugs(code, language, files = []) {
        try {
            let context = `Analyze the following ${language} code for potential bugs, errors, or issues.`;

            if (files.length > 0) {
                context += '\n\nProject Files Context:\n';
                files.forEach(f => {
                    context += `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
                });
            }

            context += `\n\nTarget Code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide:
1. List of issues found
2. Suggested fixes for each issue
3. Improved version of the code

Format your response as JSON with this structure:
{
  "issues": [{"line": number, "description": "issue description", "severity": "high|medium|low"}],
  "fixes": ["fix suggestion 1", "fix suggestion 2"],
  "improvedCode": "corrected code here"
}`;

            const prompt = context;

            if (this.provider === 'gemini') {
                const geminiPrompt = `You are an expert code reviewer. Identify bugs and suggest fixes. Consider cross-file dependencies. Return only valid JSON.\n\n${prompt}`;
                const result = await this.gemini.generateContent(geminiPrompt);
                const response = await result.response;
                const text = response.text();

                // Try to extract JSON from markdown if present
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : text;
                return JSON.parse(jsonStr);
            }

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert code reviewer. Identify bugs and suggest fixes. Consider cross-file dependencies.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3,
                response_format: { type: 'json_object' }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error('AI Bug Detection Error:', error);
            // Return empty structure on error to prevent crashing
            return { issues: [], fixes: [], improvedCode: code };
        }
    }

    /**
     * Suggest code refactoring improvements
     * @param {string} code - Code to refactor
     * @param {string} language - Programming language
     * @returns {Promise<object>} - Refactoring suggestions
     */
    async suggestRefactoring(code, language, files = []) {
        try {
            let context = `Analyze the following ${language} code and suggest improvements for:
1. Code readability
2. Performance optimization
3. Best practices
4. Code structure`;

            if (files.length > 0) {
                context += '\n\nProject Files Context:\n';
                files.forEach(f => {
                    context += `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
                });
            }

            context += `\n\nTarget Code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide specific suggestions and improved code.`;

            const prompt = context;

            if (this.provider === 'gemini') {
                const geminiPrompt = `You are a senior software engineer specializing in code refactoring and optimization. Consider the entire project context.\n\n${prompt}`;
                const result = await this.gemini.generateContent(geminiPrompt);
                const response = await result.response;
                return {
                    suggestions: response.text(),
                    timestamp: new Date().toISOString()
                };
            }

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior software engineer specializing in code refactoring and optimization. Consider the entire project context.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.4,
            });

            return {
                suggestions: response.choices[0].message.content,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('AI Refactoring Error:', error);
            throw new Error('Failed to suggest refactoring');
        }
    }

    /**
     * Chat with AI assistant about code
     * @param {string} message - User message
     * @param {string} codeContext - Current code context
     * @param {array} conversationHistory - Previous messages
     * @returns {Promise<string>} - AI response
     */
    async chatWithAI(message, codeContext = '', conversationHistory = [], files = []) {
        try {
            // Add current message with code context and files if available
            let userMessage = message;

            if (files.length > 0) {
                userMessage += '\n\nProject Files:\n';
                files.forEach(f => {
                    userMessage += `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
                });
            }

            if (codeContext) {
                userMessage += `\n\nCurrent code context:\n\`\`\`\n${codeContext}\n\`\`\``;
            }

            if (this.provider === 'gemini') {
                // Construct chat history for Gemini
                const history = conversationHistory.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'model' instead of 'assistant'
                    parts: [{ text: msg.content }]
                }));

                const chat = this.gemini.startChat({
                    history: history,
                    generationConfig: {
                        maxOutputTokens: 1000,
                    },
                });

                const result = await chat.sendMessage(userMessage);
                const response = await result.response;
                return response.text();
            }

            const messages = [
                {
                    role: 'system',
                    content: 'You are an expert programming assistant. Help users with coding questions, provide explanations, and suggest solutions. Be concise and practical. You have access to the project files.'
                }
            ];

            // Add conversation history
            conversationHistory.forEach(msg => {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            });

            messages.push({
                role: 'user',
                content: userMessage
            });

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
                max_tokens: 800,
                temperature: 0.7,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('AI Chat Error:', error);
            throw new Error('Failed to chat with AI');
        }
    }

    /**
     * Fix code based on error log
     * @param {string} code - The code with the error
     * @param {string} errorLog - The error message or log
     * @param {string} language - The programming language of the code
     * @returns {Promise<object>} - A JSON object containing the fixed code and an explanation
     */
    async fixError(code, errorLog, language) {
        try {
            const prompt = `I have an error in my ${language} code.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nError Log:\n\`\`\`\n${errorLog}\n\`\`\`\n\nPlease analyze the error and provide a fix. Return a JSON object with the following structure:\n{\n    "fixedCode": "The full corrected code content",\n    "explanation": "Brief explanation of the fix"\n}`;

            if (this.provider === 'gemini') {
                const geminiPrompt = `You are an expert debugger. Analyze the code and error log to provide a working fix. Return ONLY valid JSON.\n\n${prompt}`;
                const result = await this.gemini.generateContent(geminiPrompt);
                const response = await result.response;
                const text = response.text();

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : text;
                return JSON.parse(jsonStr);
            }

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are an expert debugger. Analyze the code and error log to provide a working fix. Return ONLY JSON.' },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2,
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error('Error fixing code:', error);
            throw new Error('Failed to fix code');
        }
    }

    /**
     * Suggests a shell command to fix a given terminal error.
     * @param {string} errorLog - The terminal error log.
     * @returns {Promise<object>} - An object containing the suggested command string.
     */
    async fixTerminalError(errorLog) {
        try {
            const prompt = `User encountered this terminal error:\n${errorLog}\n\nSuggest a single shell command to fix it. Return ONLY the command string, no markdown, no backticks, no explanations. If it requires code changes or complex manual intervention, return 'CODE_FIX_REQUIRED'.`;

            if (this.provider === 'gemini') {
                const geminiPrompt = `You are a CLI expert. Provide a single command to fix the error. Return ONLY the command string.\n\n${prompt}`;
                const result = await this.gemini.generateContent(geminiPrompt);
                const response = await result.response;
                const text = response.text();
                const cleanCommand = text.replace(/^```\w*\s*/, '').replace(/\s*```$/, '').trim();
                return { command: cleanCommand };
            }

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a CLI expert associated with a Linux/Unix terminal environment (or PowerShell if likely Windows). Provide a single command to fix the error. Return ONLY the command string.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
            });

            const command = response.choices[0].message.content.trim();
            const cleanCommand = command.replace(/^```\w*\s*/, '').replace(/\s*```$/, '').trim();

            return { command: cleanCommand };
        } catch (error) {
            console.error('Error fixing terminal error:', error);
            throw new Error('Failed to fix terminal error');
        }
    }
}

export default new AIService();
