
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import pkg from 'openai';
const { OpenAI } = pkg;
const openai = pkg.default || pkg;

class AgentService {
    constructor() {
        this.model = process.env.AI_MODEL || 'gpt-4o-mini';
        this._openai = null;
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
                    description: "Run a terminal command (e.g., 'npm install', 'ls -la').",
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
                    name: "read_terminal",
                    description: "Read the output logs from the project terminal.",
                    parameters: {
                        type: "object",
                        properties: {},
                        required: []
                    }
                }
            }
        ];
    }

    /**
     * Execute the Agent Logic.
     * @param {string} prompt - User instruction
     * @param {string} projectId - ID of the project
     * @returns {Promise<object>} - Result of the agent action
     */
    async runAgent(prompt, projectId) {
        // Assume temporary project structure for now, matching TerminalService logic
        // Project Root: ../../temp/{projectId}
        // Actually, let's verify where projects are stored. 
        // Based on TerminalService: path.join(__dirname, '../../temp', projectId)
        // But files route uses DB.
        // If we want to manipulate "real" files, we must interact with the DB or the File System if it's synced.
        // TerminalService syncs files to disk before run.
        // For this Agent to be effective, it should probably work on the DB files mostly, OR the disk files if we want to run commands.
        // DECISION: We will use the DISK workspace 'temp/{projectId}' as the source of truth for the AGENT 
        // because it needs to run commands. We must ensure DB is synced.

        // TODO: Sync DB to Disk (This should ideally be done before calling agent, or agent does it)

        const projectDir = path.resolve(process.cwd(), 'temp', projectId);
        fs.ensureDirSync(projectDir);

        const tools = this.getTools();
        const messages = [
            {
                role: "system",
                content: `You are an autonomous coding agent. 
                You can create files, read files, and run commands.
                The project is located at: ${projectDir}
                Always use relative paths from the project root.
                If you need to create a react component, use standard modern React + Tailwind practices.
                If you run a command, wait for the output to decide next steps.
                Explain your actions briefly.`
            },
            { role: "user", content: prompt }
        ];

        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
                tools: tools,
                tool_choice: "auto",
                temperature: 0.1
            });

            const responseMessage = response.choices[0].message;
            const toolCalls = responseMessage.tool_calls;

            if (toolCalls) {
                const results = [];
                for (const toolCall of toolCalls) {
                    const functionName = toolCall.function.name;
                    const functionArgs = JSON.parse(toolCall.function.arguments);

                    let output;
                    try {
                        if (functionName === "write_file") {
                            output = await this.handleWriteFile(projectId, projectDir, functionArgs.filePath, functionArgs.content);
                        } else if (functionName === "read_file") {
                            output = await this.handleReadFile(projectDir, functionArgs.filePath);
                        } else if (functionName === "list_dir") {
                            output = await this.handleListDir(projectDir, functionArgs.dirPath);
                        } else if (functionName === "run_command") {
                            output = await this.handleRunCommand(projectDir, functionArgs.command);
                        } else if (functionName === "read_terminal") {
                            output = await this.handleReadTerminal(projectId);
                        }
                    } catch (e) {
                        output = `Error: ${e.message}`;
                    }

                    results.push({
                        tool: functionName,
                        args: functionArgs,
                        output: output
                    });
                }

                return {
                    response: "I have executed the requested actions.",
                    actions: results,
                    success: true
                };
            }

            return {
                response: responseMessage.content,
                actions: [],
                success: true
            };

        } catch (error) {
            console.error("Agent Error:", error);
            throw new Error("Agent failed to execute");
        }
    }

    // --- Helper Tool Handlers ---

    async handleWriteFile(projectId, projectDir, filePath, content) {
        const fullPath = path.join(projectDir, filePath);
        await fs.outputFile(fullPath, content);
        // TODO: Sync to Database here so standard FileExplorer sees it? 
        // For this MVP, we assume running on Disk is priority. 
        // In a real app, we'd call File.create({ projectId, ... })
        return `Successfully wrote to ${filePath}`;
    }

    async handleReadFile(projectDir, filePath) {
        const fullPath = path.join(projectDir, filePath);
        if (await fs.exists(fullPath)) {
            const content = await fs.readFile(fullPath, 'utf8');
            return content;
        }
        return `File ${filePath} not found.`;
    }

    async handleListDir(projectDir, dirPath) {
        const fullPath = path.join(projectDir, dirPath);
        if (await fs.exists(fullPath)) {
            const files = await fs.readdir(fullPath);
            return files.join('\n');
        }
        return `Directory ${dirPath} not found.`;
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
                resolve(output + `\n(Exit Code: ${code})`);
            });

            // Timeout after 10 seconds to prevent hangs
            setTimeout(() => {
                child.kill();
                resolve(output + '\n(Command Timed Out)');
            }, 10000);
        });
    }

    async handleReadTerminal(projectId) {
        // Dynamic import to avoid circular dependency if any (though here it shouldn't be circular as TerminalService doesn't import AgentService)
        // Actually static import is better but I can't add it to top easily without replacing whole file head.
        // I will use dynamic import for safety and ease of editing.
        const { default: TerminalService } = await import('./terminalService.js');
        const logs = TerminalService.getInstance().getLogs(projectId);
        return logs || "No terminal output logs found.";
    }
}

export default new AgentService();
