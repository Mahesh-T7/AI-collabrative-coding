import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CodeExecutionService {
    constructor(io) {
        this.io = io;
        this.executionTimeout = 10000; // 10 seconds timeout

        this.io.on('connection', (socket) => {
            socket.on('code:execute', async ({ projectId, filename, code, language }) => {
                try {
                    await this.executeCode(projectId, filename, code, language, socket);
                } catch (error) {
                    // Send error to terminal
                    this.io.emit('terminal:output', {
                        projectId,
                        data: `\r\n\x1b[31mError: ${error.message}\x1b[0m\r\n`
                    });

                    socket.emit('code:error', {
                        projectId,
                        error: error.message
                    });
                }
            });
        });
    }

    async executeCode(projectId, filename, code, language, socket) {
        // Notify terminal about execution start
        this.io.emit('terminal:output', {
            projectId,
            data: `\r\n\x1b[36m> Executing ${filename}...\x1b[0m\r\n`
        });

        // Create temp directory for this project
        const tempDir = path.join(__dirname, '../../temp', projectId);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filePath = path.join(tempDir, filename);
        fs.writeFileSync(filePath, code, 'utf8');

        let command, args;

        switch (language) {
            case 'python':
                command = 'python';
                args = [filePath];
                break;

            case 'java':
                // Java requires compilation first
                const className = filename.replace('.java', '');
                await this.compileJava(tempDir, filename, projectId, socket);
                command = 'java';
                args = ['-cp', tempDir, className];
                break;

            case 'c':
                // Compile C code
                const cExecutable = path.join(tempDir, 'program.exe');
                await this.compileC(tempDir, filename, cExecutable, projectId, socket);
                command = cExecutable;
                args = [];
                break;

            case 'cpp':
                // Compile C++ code
                const cppExecutable = path.join(tempDir, 'program.exe');
                await this.compileCpp(tempDir, filename, cppExecutable, projectId, socket);
                command = cppExecutable;
                args = [];
                break;

            default:
                throw new Error(`Unsupported language: ${language}`);
        }

        // Execute the code
        this.runCommand(command, args, projectId, socket);
    }

    async compileJava(dir, filename, projectId, socket) {
        return new Promise((resolve, reject) => {
            const javac = spawn('javac', [filename], { cwd: dir });

            let errorOutput = '';

            javac.stderr.on('data', (data) => {
                errorOutput += data.toString();
                this.io.to(projectId).emit('terminal:output', {
                    projectId,
                    data: data.toString()
                });
            });

            javac.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Java compilation failed:\n${errorOutput}`));
                } else {
                    this.io.to(projectId).emit('terminal:output', {
                        projectId,
                        data: '✓ Compilation successful\n'
                    });
                    resolve();
                }
            });
        });
    }

    async compileC(dir, filename, outputPath, projectId, socket) {
        return new Promise((resolve, reject) => {
            const gcc = spawn('gcc', [filename, '-o', outputPath], { cwd: dir });

            let errorOutput = '';

            gcc.stderr.on('data', (data) => {
                errorOutput += data.toString();
                this.io.to(projectId).emit('terminal:output', {
                    projectId,
                    data: data.toString()
                });
            });

            gcc.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`C compilation failed:\n${errorOutput}`));
                } else {
                    this.io.to(projectId).emit('terminal:output', {
                        projectId,
                        data: '✓ Compilation successful\n'
                    });
                    resolve();
                }
            });
        });
    }

    async compileCpp(dir, filename, outputPath, projectId, socket) {
        return new Promise((resolve, reject) => {
            const gpp = spawn('g++', [filename, '-o', outputPath], { cwd: dir });

            let errorOutput = '';

            gpp.stderr.on('data', (data) => {
                errorOutput += data.toString();
                this.io.to(projectId).emit('terminal:output', {
                    projectId,
                    data: data.toString()
                });
            });

            gpp.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`C++ compilation failed:\n${errorOutput}`));
                } else {
                    this.io.to(projectId).emit('terminal:output', {
                        projectId,
                        data: '✓ Compilation successful\n'
                    });
                    resolve();
                }
            });
        });
    }

    runCommand(command, args, projectId, socket) {
        const process = spawn(command, args);

        // Set timeout
        const timeout = setTimeout(() => {
            process.kill();
            this.io.to(projectId).emit('terminal:output', {
                projectId,
                data: '\n❌ Execution timeout (10 seconds)\n'
            });
        }, this.executionTimeout);

        process.stdout.on('data', (data) => {
            this.io.emit('terminal:output', {
                projectId,
                data: data.toString()
            });
        });

        process.stderr.on('data', (data) => {
            this.io.emit('terminal:output', {
                projectId,
                data: data.toString()
            });
        });

        process.on('close', (code) => {
            clearTimeout(timeout);
            this.io.to(projectId).emit('terminal:output', {
                projectId,
                data: `\n✓ Process exited with code ${code}\n`
            });
            this.io.emit('code:execution-complete', {
                projectId,
                exitCode: code
            });
        });

        process.on('error', (error) => {
            clearTimeout(timeout);
            this.io.to(projectId).emit('terminal:output', {
                projectId,
                data: `\n❌ Error: ${error.message}\n`
            });
        });
    }
}

export default CodeExecutionService;
