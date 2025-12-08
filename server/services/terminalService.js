import os from 'os';
import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pty;
try {
    pty = await import('node-pty');
    pty = pty.default || pty;
} catch (e) {
    console.warn('node-pty not found, falling back to child_process. Terminal will not be interactive.');
}

class TerminalService {
    constructor(io) {
        this.io = io;
        this.sessions = new Map(); // "projectId:terminalId" -> process

        this.io.on('connection', (socket) => {
            // Run File
            socket.on('terminal:run-file', ({ projectId, terminalId, filename }) => {
                const key = terminalId ? `${projectId}:${terminalId}` : projectId;
                const termProcess = this.sessions.get(key);
                if (termProcess) {
                    this.runFileInTerminal(termProcess, projectId, terminalId, filename);
                }
            });

            // Run Code (Compile & Run)
            socket.on('terminal:run-code', async ({ projectId, terminalId, filename, code }) => {
                const projectDir = path.join(__dirname, '../../temp', projectId);
                if (!fs.existsSync(projectDir)) {
                    fs.mkdirSync(projectDir, { recursive: true });
                }
                const filePath = path.join(projectDir, filename);
                fs.writeFileSync(filePath, code || '', 'utf8');

                const key = terminalId ? `${projectId}:${terminalId}` : projectId;
                const existingProcess = this.sessions.get(key);
                if (existingProcess) {
                    try {
                        process.kill(existingProcess.pid);
                    } catch (e) { /* ignore */ }
                    this.sessions.delete(key);
                }

                await this.compileAndRun(projectId, terminalId, projectDir, filename);
            });

            // Input
            socket.on('terminal:input', ({ projectId, terminalId, data }) => {
                const key = terminalId ? `${projectId}:${terminalId}` : projectId;
                const p = this.sessions.get(key);
                if (p) {
                    p.write(data);
                }
            });

            // Resize
            socket.on('terminal:resize', ({ projectId, terminalId, cols, rows }) => {
                const key = terminalId ? `${projectId}:${terminalId}` : projectId;
                const p = this.sessions.get(key);
                if (p && p.resize) {
                    p.resize(cols, rows);
                }
            });

            // Create Session
            socket.on('terminal:create', ({ projectId, terminalId, profile }) => {
                const key = terminalId ? `${projectId}:${terminalId}` : projectId;
                if (!this.sessions.has(key)) {
                    this.createSession(projectId, terminalId, profile);
                }
            });

            // Destroy Session
            socket.on('terminal:destroy', ({ projectId, terminalId }) => {
                const key = terminalId ? `${projectId}:${terminalId}` : projectId;
                const p = this.sessions.get(key);
                if (p) {
                    try {
                        process.kill(p.pid);
                    } catch (e) { }
                    this.sessions.delete(key);
                }
            });

            socket.on('disconnect', () => {
                // Cleanup optional
            });
        });
    }

    createSession(projectId, terminalId, profile = 'default') {
        const isWin = os.platform() === 'win32';
        let shell = isWin ? 'powershell.exe' : 'bash';
        let args = [];

        // Profile selection
        if (profile === 'cmd' && isWin) {
            shell = 'cmd.exe';
        } else if (profile === 'powershell' && isWin) {
            shell = 'powershell.exe';
            args = ['-NoLogo', '-NoProfile'];
        } else if (profile === 'gitbash' && isWin) {
            const commonPaths = [
                'C:\\Program Files\\Git\\bin\\bash.exe',
                'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
                process.env.ProgramW6432 ? process.env.ProgramW6432 + '\\Git\\bin\\bash.exe' : ''
            ];
            const found = commonPaths.find(p => p && fs.existsSync(p));
            if (found) {
                shell = found;
                args = ['--login'];
            } else {
                shell = 'powershell.exe';
                args = ['-NoLogo', '-NoProfile'];
            }
        } else if (!isWin) {
            shell = 'bash';
            if (profile === 'sh') shell = 'sh';
            if (profile === 'zsh') shell = 'zsh';
            args = ['-l'];
        }

        const projectDir = path.join(__dirname, '../../temp', projectId);
        let cwd = process.cwd();
        try {
            if (fs.existsSync(projectDir)) {
                cwd = projectDir;
            }
        } catch (e) {
            console.error('Error checking project dir:', e);
        }

        // Final check if args empty for powershell default
        if (shell.includes('powershell') && args.length === 0) {
            args = ['-NoLogo', '-NoProfile'];
        }

        const key = terminalId ? `${projectId}:${terminalId}` : projectId;
        let termProcess;

        if (pty) {
            termProcess = pty.spawn(shell, args, {
                name: 'xterm-color',
                cols: 80,
                rows: 30,
                cwd: cwd,
                env: process.env
            });

            termProcess.onData((data) => {
                this.io.emit('terminal:output', { projectId, terminalId, data });
            });

            termProcess.onExit(() => {
                this.sessions.delete(key);
                this.io.emit('terminal:exit', { projectId, terminalId });
            });
        } else {
            // Fallback
            termProcess = spawn(shell, args, {
                cwd: cwd,
                env: process.env,
                shell: true
            });

            termProcess.stdout.on('data', (data) => {
                this.io.emit('terminal:output', { projectId, terminalId, data: data.toString() });
            });

            termProcess.stderr.on('data', (data) => {
                this.io.emit('terminal:output', { projectId, terminalId, data: data.toString() });
            });

            termProcess.write = (data) => {
                if (termProcess.stdin) {
                    termProcess.stdin.write(data);
                }
            };
            termProcess.resize = () => { };

            termProcess.on('exit', () => {
                this.sessions.delete(key);
                this.io.emit('terminal:exit', { projectId, terminalId });
            });
        }

        this.sessions.set(key, termProcess);
        return termProcess;
    }

    async compileAndRun(projectId, terminalId, projectDir, filename) {
        const ext = path.extname(filename);
        const isWin = os.platform() === 'win32';
        const key = terminalId ? `${projectId}:${terminalId}` : projectId;

        const emitOutput = (data) => {
            this.io.emit('terminal:output', { projectId, terminalId, data: data.toString() });
        };

        let cmd, args;
        try {
            switch (ext) {
                case '.py': cmd = 'python'; args = ['-u', filename]; break;
                case '.js': cmd = 'node'; args = [filename]; break;
                case '.java':
                    emitOutput('\x1b[33mCompiling Java...\x1b[0m\r\n');
                    await new Promise((resolve, reject) => {
                        const javac = spawn('javac', [filename], { cwd: projectDir });
                        javac.stderr.on('data', d => emitOutput(d));
                        javac.on('close', code => code === 0 ? resolve() : reject());
                    });
                    cmd = 'java'; args = [filename.replace('.java', '')];
                    break;
                case '.c': case '.cpp':
                    const compiler = ext === '.c' ? 'gcc' : 'g++';
                    const outExe = isWin ? 'program.exe' : './program';
                    emitOutput(`\x1b[33mCompiling ${ext === '.c' ? 'C' : 'C++'}...\x1b[0m\r\n`);
                    await new Promise((resolve, reject) => {
                        const proc = spawn(compiler, [filename, '-o', outExe], { cwd: projectDir });
                        proc.stderr.on('data', d => emitOutput(d));
                        proc.on('close', code => code === 0 ? resolve() : reject());
                    });
                    cmd = path.join(projectDir, outExe); args = [];
                    break;
                default:
                    emitOutput(`Unsupported language: ${ext}\r\n`); return;
            }

            if (pty) {
                const termProcess = pty.spawn(cmd, args, {
                    name: 'xterm-color',
                    cols: 80,
                    rows: 30,
                    cwd: projectDir,
                    env: process.env
                });
                termProcess.onData((data) => this.io.emit('terminal:output', { projectId, terminalId, data }));
                termProcess.onExit(() => {
                    this.sessions.delete(key);
                    emitOutput('\r\n\x1b[2mProgram exited.\x1b[0m\r\n');
                });
                this.sessions.set(key, termProcess);
            } else {
                emitOutput("PTY not available. Falling back to non-interactive spawn.\r\n");
            }
        } catch (e) {
            emitOutput(`\r\n\x1b[31mCompilation/Execution Error\x1b[0m\r\n`);
        }
    }
}

export default TerminalService;

