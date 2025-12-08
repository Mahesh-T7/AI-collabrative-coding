import pkg from 'openai';
const { OpenAI } = pkg;
const openai = pkg.default || pkg;

class AIService {
    constructor() {
        this._openai = null;
        this.model = process.env.AI_MODEL || 'gpt-4o-mini';
    }

    get openai() {
        if (!this._openai) {
            this._openai = new (OpenAI || openai)({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
        return this._openai;
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
            throw new Error('Failed to detect bugs');
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
     * @param {string} code - Current code
     * @param {string} errorLog - Error output from terminal
     * @param {string} language - Programming language
     * @returns {Promise<string>} - Expected to return a JSON string with fixedCode and explanation
     */
    async fixError(code, errorLog, language = 'javascript') {
        try {
            const prompt = `I have an error in my ${language} code.
            
Code:
\`\`\`${language}
${code}
\`\`\`

Error Log:
\`\`\`
${errorLog}
\`\`\`

Please analyze the error and provide a fix. Return a JSON object with the following structure:
{
    "fixedCode": "The full corrected code content",
    "explanation": "Brief explanation of the fix"
}
`;

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert debugger. Analyze the code and error log to provide a working fix. Return ONLY JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.2,
                response_format: { type: 'json_object' }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error('AI Fix Error:', error);
            throw new Error('Failed to fix error');
        }
    }
}

export default new AIService();
