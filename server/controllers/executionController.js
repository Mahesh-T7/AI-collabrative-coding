import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp directory exists
const TEMP_DIR = path.join(__dirname, '../../temp_execution');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const EXECUTION_TIMEOUT = 5000; // 5 seconds
const MAX_BUFFER = 1024 * 1024; // 1MB buffer

// Helper to execute via Piston API (Cloud Fallback)
const executeOnPiston = async (language, code, stdin = '') => {
    try {
        const pistonLangs = {
            'python': { language: 'python', version: '3.10.0' },
            'javascript': { language: 'javascript', version: '18.15.0' },
            'typescript': { language: 'typescript', version: '5.0.3' },
            'cpp': { language: 'c++', version: '10.2.0' },
            'c': { language: 'c', version: '10.2.0' },
            'java': { language: 'java', version: '15.0.2' },
            'go': { language: 'go', version: '1.16.2' },
            'rust': { language: 'rust', version: '1.68.2' },
            'ruby': { language: 'ruby', version: '3.0.1' },
            'php': { language: 'php', version: '8.2.3' },
        };

        const config = pistonLangs[language];
        if (!config) throw new Error('Language not supported by Cloud Runner');

        const requestBody = {
            language: config.language,
            version: config.version,
            files: [{ content: code }]
        };

        // Add stdin if provided
        if (stdin) {
            requestBody.stdin = stdin;
        }

        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.run) {
            return {
                output: data.run.output,
                error: data.run.stderr ? data.run.stderr : null
            };
        }
        return { error: 'Cloud execution failed' };
    } catch (e) {
        return { error: `Cloud Runner Error: ${e.message}` };
    }
};

export const executeCode = async (req, res) => {
    const { language, code, stdin = '' } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    const filename = `script_${requestId}`;

    // Cleanup helper
    const cleanup = (files) => {
        files.forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });
    };

    try {
        let cmd, args, filePath, outputExe;
        let tempFiles = [];

        switch (language) {
            case 'python':
                filePath = path.join(TEMP_DIR, `${filename}.py`);
                fs.writeFileSync(filePath, code);
                tempFiles.push(filePath);
                cmd = 'python';
                args = [filePath];
                break;

            case 'javascript':
                filePath = path.join(TEMP_DIR, `${filename}.js`);
                fs.writeFileSync(filePath, code);
                tempFiles.push(filePath);
                cmd = 'node';
                args = [filePath];
                break;

            case 'cpp':
                filePath = path.join(TEMP_DIR, `${filename}.cpp`);
                outputExe = path.join(TEMP_DIR, `${filename}${os.platform() === 'win32' ? '.exe' : ''}`);
                fs.writeFileSync(filePath, code);
                tempFiles.push(filePath);

                // Compile first
                try {
                    await new Promise((resolve, reject) => {
                        execFile('g++', [filePath, '-o', outputExe], { timeout: 10000 }, (error, stdout, stderr) => {
                            if (error) reject(stderr || error.message);
                            else resolve();
                        });
                    });
                    tempFiles.push(outputExe);
                    cmd = outputExe;
                    args = [];
                } catch (compileError) {
                    cleanup(tempFiles);
                    // Check for missing compiler
                    if (compileError.toString().includes('ENOENT') || compileError.toString().includes('not found') || compileError.toString().includes('is not recognized')) {
                        console.log(`Local compiler missing for ${language}, switching to Cloud Runner...`);
                        const cloudResult = await executeOnPiston(language, code, stdin);
                        return res.json(cloudResult);
                    }
                    return res.json({ error: `Compilation Error:\n${compileError}` });
                }
                break;

            case 'c':
                filePath = path.join(TEMP_DIR, `${filename}.c`);
                outputExe = path.join(TEMP_DIR, `${filename}${os.platform() === 'win32' ? '.exe' : ''}`);
                fs.writeFileSync(filePath, code);
                tempFiles.push(filePath);

                // Compile first
                try {
                    await new Promise((resolve, reject) => {
                        execFile('gcc', [filePath, '-o', outputExe], { timeout: 10000 }, (error, stdout, stderr) => {
                            if (error) reject(stderr || error.message);
                            else resolve();
                        });
                    });
                    tempFiles.push(outputExe);
                    cmd = outputExe;
                    args = [];
                } catch (compileError) {
                    cleanup(tempFiles);
                    if (compileError.toString().includes('ENOENT') || compileError.toString().includes('not found') || compileError.toString().includes('is not recognized')) {
                        console.log(`Local compiler missing for ${language}, switching to Cloud Runner...`);
                        const cloudResult = await executeOnPiston(language, code, stdin);
                        return res.json(cloudResult);
                    }
                    return res.json({ error: `Compilation Error:\n${compileError}` });
                }
                break;

            case 'java':
                const javaDir = path.join(TEMP_DIR, requestId);
                fs.mkdirSync(javaDir);
                filePath = path.join(javaDir, 'Main.java');
                fs.writeFileSync(filePath, code);

                try {
                    await new Promise((resolve, reject) => {
                        execFile('javac', [filePath], { cwd: javaDir, timeout: 10000 }, (error, stdout, stderr) => {
                            if (error) reject(stderr || error.message);
                            else resolve();
                        });
                    });

                    cmd = 'java';
                    args = ['-cp', javaDir, 'Main'];
                } catch (compileError) {
                    fs.rmSync(javaDir, { recursive: true, force: true });
                    if (compileError.toString().includes('ENOENT') || compileError.toString().includes('not found') || compileError.toString().includes('is not recognized')) {
                        console.log(`Local compiler missing for ${language}, switching to Cloud Runner...`);
                        const cloudResult = await executeOnPiston(language, code, stdin);
                        return res.json(cloudResult);
                    }
                    return res.json({ error: `Compilation Error:\n${compileError}` });
                }
                break;

            default:
                // If not supported locally, try Cloud directly
                console.log(`Language ${language} not supported locally, trying Cloud Runner...`);
                const cloudResult = await executeOnPiston(language, code, stdin);
                return res.json(cloudResult);
            // return res.status(400).json({ error: 'Unsupported language' });
        }

        // Execution
        execFile(cmd, args, {
            timeout: EXECUTION_TIMEOUT,
            maxBuffer: MAX_BUFFER
        }, async (error, stdout, stderr) => {
            // Cleanup execution files
            if (language === 'java') {
                const javaDir = path.join(TEMP_DIR, requestId);
                if (fs.existsSync(javaDir)) fs.rmSync(javaDir, { recursive: true, force: true });
            } else {
                cleanup(tempFiles);
            }

            if (error) {
                if (error.killed) {
                    return res.json({ error: 'Execution Timed Out (limit: 5s)' });
                }

                // If local runtime missing (ENOENT), try Cloud
                // On Windows, 'python' might be an alias that prints "Python was not found" to stderr instead of ENOENT
                if (error.code === 'ENOENT' || (stderr && stderr.includes('Python was not found'))) {
                    console.log(`Local runtime missing for ${language}, switching to Cloud Runner...`);
                    const cloudResult = await executeOnPiston(language, code, stdin);
                    return res.json(cloudResult);
                }

                return res.json({
                    error: stderr || error.message,
                    output: stdout
                });
            }

            return res.json({
                output: stdout.trimRight() + (stderr ? '\n' + stderr : '')
            });
        });

    } catch (e) {
        console.error("Executor Error:", e);
        return res.status(500).json({ error: 'Internal User Error' });
    }
};
