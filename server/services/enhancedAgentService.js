import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import pkg from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
const { OpenAI } = pkg;
const openai = pkg.default || pkg;

class EnhancedAgentService {
    constructor() {
        this.model = process.env.AI_MODEL || 'gpt-4o-mini';
        this.geminiModelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
        this._openai = null;
        this._gemini = null;
        this.maxIterations = 10; // Prevent infinite loops
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
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!this._gemini && apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            this._gemini = genAI.getGenerativeModel({ model: this.geminiModelName });
        }
        return this._gemini;
    }

    get provider() {
        // Prioritize Gemini if available
        if (this.gemini) return 'gemini';
        if (this.openai) return 'openai';
        throw new Error('No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY in your .env file.');
    }

    /**
     * Define the tools available to the Agent.
     */
    getTools() {
        return [
            {
                type: "function",
                function: {
                    name: "write_file",
                    description: "Write content to a file. Creates the file if it doesn't exist. Overwrites existing content.",
                    parameters: {
                        type: "object",
                        properties: {
                            filePath: {
                                type: "string",
                                description: "Relative path to the file (e.g., 'src/components/Button.tsx')"
                            },
                            content: {
                                type: "string",
                                description: "The full content to write to the file"
                            }
                        },
                        required: ["filePath", "content"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "read_file",
                    description: "Read the content of a file.",
                    parameters: {
                        type: "object",
                        properties: {
                            filePath: {
                                type: "string",
                                description: "Relative path to the file"
                            }
                        },
                        required: ["filePath"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "update_file",
                    description: "Update specific parts of a file without rewriting the entire content. Useful for fixing specific errors.",
                    parameters: {
                        type: "object",
                        properties: {
                            filePath: {
                                type: "string",
                                description: "Relative path to the file"
                            },
                            searchText: {
                                type: "string",
                                description: "The exact text to find and replace"
                            },
                            replaceText: {
                                type: "string",
                                description: "The new text to replace with"
                            }
                        },
                        required: ["filePath", "searchText", "replaceText"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "delete_file",
                    description: "Delete a file from the project.",
                    parameters: {
                        type: "object",
                        properties: {
                            filePath: {
                                type: "string",
                                description: "Relative path to the file to delete"
                            }
                        },
                        required: ["filePath"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "list_dir",
                    description: "List files and directories in a folder.",
                    parameters: {
                        type: "object",
                        properties: {
                            dirPath: {
                                type: "string",
                                description: "Relative path to the directory (use '.' for root)"
                            }
                        },
                        required: ["dirPath"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "run_command",
                    description: "Run a terminal command (e.g., 'npm install', 'npm run build'). Use this to install dependencies, run tests, or build the project.",
                    parameters: {
                        type: "object",
                        properties: {
                            command: {
                                type: "string",
                                description: "The command to execute"
                            }
                        },
                        required: ["command"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "analyze_error",
                    description: "Analyze error messages from terminal output or code execution to understand the root cause.",
                    parameters: {
                        type: "object",
                        properties: {
                            errorMessage: {
                                type: "string",
                                description: "The error message to analyze"
                            }
                        },
                        required: ["errorMessage"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_files",
                    description: "Search for specific text or patterns across all files in the project.",
                    parameters: {
                        type: "object",
                        properties: {
                            searchTerm: {
                                type: "string",
                                description: "The text or pattern to search for"
                            },
                            fileExtension: {
                                type: "string",
                                description: "Optional file extension filter (e.g., '.js', '.tsx')"
                            }
                        },
                        required: ["searchTerm"]
                    }
                }
            }
        ];
    }

    /**
     * Execute the Enhanced Agent Logic with multi-step reasoning.
     * @param {string} prompt - User instruction
     * @param {string} projectId - ID of the project
     * @returns {Promise<object>} - Result of the agent action
     */
    async runAgent(prompt, projectId) {
        const projectDir = path.resolve(process.cwd(), 'temp', projectId);
        fs.ensureDirSync(projectDir);

        const tools = this.getTools();
        const conversationHistory = [
            {
                role: "system",
                content: `You are an autonomous coding agent with advanced debugging and error-fixing capabilities.

**Your Capabilities:**
- Create, read, update, and delete files
- Run terminal commands (npm install, build, test, etc.)
- Analyze errors and debug code
- Search across files to understand the codebase
- Fix bugs and implement features

**Project Context:**
- Project Directory: ${projectDir}
- Always use relative paths from the project root
- Use modern best practices (React, TypeScript, Tailwind CSS, etc.)

**Working Process:**
1. Understand the task thoroughly
2. Analyze existing code if needed
3. Plan your approach
4. Execute actions step by step
5. Verify results and fix any errors
6. Provide clear explanations of what you did

**Error Handling:**
- If a command fails, analyze the error
- Try alternative solutions
- Install missing dependencies automatically
- Fix syntax errors and type issues

Be thorough, methodical, and always explain your reasoning.`
            },
            { role: "user", content: prompt }
        ];

        try {
            let iteration = 0;
            let allActions = [];
            let shouldContinue = true;

            while (shouldContinue && iteration < this.maxIterations) {
                iteration++;
                console.log(`\n=== Agent Iteration ${iteration} ===`);

                const response = await this.callAI(conversationHistory, tools);
                const responseMessage = response.message;
                const toolCalls = response.toolCalls;

                conversationHistory.push({
                    role: "assistant",
                    content: responseMessage.content || null,
                    tool_calls: toolCalls || undefined
                });

                if (toolCalls && toolCalls.length > 0) {
                    const results = [];

                    for (const toolCall of toolCalls) {
                        const functionName = toolCall.function.name;
                        const functionArgs = JSON.parse(toolCall.function.arguments);

                        console.log(`Executing: ${functionName}`, functionArgs);

                        let output;
                        try {
                            output = await this.executeToolCall(functionName, functionArgs, projectId, projectDir);
                        } catch (e) {
                            output = `Error: ${e.message}`;
                        }

                        results.push({
                            tool: functionName,
                            args: functionArgs,
                            output: output
                        });

                        // Add tool result to conversation
                        conversationHistory.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: output
                        });
                    }

                    allActions.push(...results);

                    // Check if we should continue (agent might want to do more)
                    // We'll do one more iteration to let the agent summarize or continue
                } else {
                    // No more tool calls, agent is done
                    shouldContinue = false;
                }

                // Safety check: if last message was just text with no tools, we're done
                if (!toolCalls || toolCalls.length === 0) {
                    shouldContinue = false;
                }
            }

            // Get final summary from agent
            const finalResponse = conversationHistory[conversationHistory.length - 1];
            const summary = finalResponse.content || "Task completed successfully.";

            return {
                response: summary,
                actions: allActions,
                iterations: iteration,
                success: true
            };

        } catch (error) {
            console.error("Enhanced Agent Error:", error);
            throw new Error(`Agent failed: ${error.message}`);
        }
    }

    /**
     * Call AI provider (OpenAI or Gemini)
     */
    async callAI(messages, tools) {
        if (this.provider === 'openai') {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
                tools: tools,
                tool_choice: "auto",
                temperature: 0.1
            });

            return {
                message: response.choices[0].message,
                toolCalls: response.choices[0].message.tool_calls
            };
        } else {
            // Gemini doesn't support function calling in the same way
            // We'll use a simplified approach for now
            const lastMessage = messages[messages.length - 1];
            const result = await this.gemini.generateContent(lastMessage.content);
            const text = result.response.text();

            return {
                message: { content: text },
                toolCalls: null
            };
        }
    }

    /**
     * Execute a tool call
     */
    async executeToolCall(functionName, args, projectId, projectDir) {
        switch (functionName) {
            case "write_file":
                return await this.handleWriteFile(projectId, projectDir, args.filePath, args.content);
            case "read_file":
                return await this.handleReadFile(projectDir, args.filePath);
            case "update_file":
                return await this.handleUpdateFile(projectDir, args.filePath, args.searchText, args.replaceText);
            case "delete_file":
                return await this.handleDeleteFile(projectDir, args.filePath);
            case "list_dir":
                return await this.handleListDir(projectDir, args.dirPath);
            case "run_command":
                return await this.handleRunCommand(projectDir, args.command);
            case "analyze_error":
                return await this.handleAnalyzeError(args.errorMessage);
            case "search_files":
                return await this.handleSearchFiles(projectDir, args.searchTerm, args.fileExtension);
            default:
                return `Unknown function: ${functionName}`;
        }
    }

    // --- Tool Handlers ---

    async handleWriteFile(projectId, projectDir, filePath, content) {
        const fullPath = path.join(projectDir, filePath);
        await fs.outputFile(fullPath, content);
        return `✅ Successfully wrote to ${filePath} (${content.length} characters)`;
    }

    async handleReadFile(projectDir, filePath) {
        const fullPath = path.join(projectDir, filePath);
        if (await fs.exists(fullPath)) {
            const content = await fs.readFile(fullPath, 'utf8');
            return content;
        }
        return `❌ File ${filePath} not found.`;
    }

    async handleUpdateFile(projectDir, filePath, searchText, replaceText) {
        const fullPath = path.join(projectDir, filePath);
        if (await fs.exists(fullPath)) {
            let content = await fs.readFile(fullPath, 'utf8');
            if (content.includes(searchText)) {
                content = content.replace(searchText, replaceText);
                await fs.writeFile(fullPath, content);
                return `✅ Updated ${filePath}: replaced text successfully`;
            }
            return `⚠️ Search text not found in ${filePath}`;
        }
        return `❌ File ${filePath} not found.`;
    }

    async handleDeleteFile(projectDir, filePath) {
        const fullPath = path.join(projectDir, filePath);
        if (await fs.exists(fullPath)) {
            await fs.remove(fullPath);
            return `✅ Deleted ${filePath}`;
        }
        return `❌ File ${filePath} not found.`;
    }

    async handleListDir(projectDir, dirPath) {
        const fullPath = path.join(projectDir, dirPath);
        if (await fs.exists(fullPath)) {
            const files = await fs.readdir(fullPath);
            const details = await Promise.all(files.map(async (file) => {
                const filePath = path.join(fullPath, file);
                const stats = await fs.stat(filePath);
                return `${stats.isDirectory() ? '📁' : '📄'} ${file}`;
            }));
            return details.join('\n');
        }
        return `❌ Directory ${dirPath} not found.`;
    }

    async handleRunCommand(projectDir, command) {
        return new Promise((resolve) => {
            const child = spawn(command, {
                cwd: projectDir,
                shell: true,
                env: process.env
            });

            let output = '';

            child.stdout.on('data', (data) => output += data.toString());
            child.stderr.on('data', (data) => output += data.toString());

            child.on('close', (code) => {
                const status = code === 0 ? '✅' : '❌';
                resolve(`${status} Command: ${command}\n${output}\n(Exit Code: ${code})`);
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                child.kill();
                resolve(`⏱️ Command timed out: ${command}\n${output}`);
            }, 30000);
        });
    }

    async handleAnalyzeError(errorMessage) {
        // Simple error analysis - can be enhanced with AI
        const analysis = {
            type: 'unknown',
            suggestions: []
        };

        if (errorMessage.includes('MODULE_NOT_FOUND') || errorMessage.includes('Cannot find module')) {
            analysis.type = 'missing_dependency';
            analysis.suggestions.push('Run npm install to install dependencies');
            const match = errorMessage.match(/Cannot find module '([^']+)'/);
            if (match) {
                analysis.suggestions.push(`Install specific package: npm install ${match[1]}`);
            }
        } else if (errorMessage.includes('SyntaxError')) {
            analysis.type = 'syntax_error';
            analysis.suggestions.push('Check for missing brackets, parentheses, or semicolons');
        } else if (errorMessage.includes('TypeError')) {
            analysis.type = 'type_error';
            analysis.suggestions.push('Check variable types and function signatures');
        } else if (errorMessage.includes('ENOENT')) {
            analysis.type = 'file_not_found';
            analysis.suggestions.push('Check if the file path is correct');
        }

        return JSON.stringify(analysis, null, 2);
    }

    async handleSearchFiles(projectDir, searchTerm, fileExtension) {
        const results = [];

        async function searchDir(dir) {
            const files = await fs.readdir(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);

                if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                    await searchDir(filePath);
                } else if (stats.isFile()) {
                    if (fileExtension && !file.endsWith(fileExtension)) continue;

                    const content = await fs.readFile(filePath, 'utf8');
                    if (content.includes(searchTerm)) {
                        const relativePath = path.relative(projectDir, filePath);
                        const lines = content.split('\n');
                        const matchingLines = lines
                            .map((line, idx) => ({ line, num: idx + 1 }))
                            .filter(({ line }) => line.includes(searchTerm))
                            .slice(0, 3); // Limit to 3 matches per file

                        results.push({
                            file: relativePath,
                            matches: matchingLines.map(m => `Line ${m.num}: ${m.line.trim()}`)
                        });
                    }
                }
            }
        }

        await searchDir(projectDir);

        if (results.length === 0) {
            return `No matches found for "${searchTerm}"`;
        }

        return results.map(r =>
            `📄 ${r.file}\n${r.matches.join('\n')}`
        ).join('\n\n');
    }
}

export default new EnhancedAgentService();
