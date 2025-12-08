/**
 * File utility functions for download, upload, and ZIP operations
 */

/**
 * Download a single file to the user's machine
 */
export function downloadFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Create and download a ZIP archive containing multiple files
 */
export async function downloadZip(
    files: Array<{ name: string; content: string }>,
    zipName: string
): Promise<void> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add all files to the ZIP archive
    files.forEach((file) => {
        zip.file(file.name, file.content);
    });

    // Generate ZIP blob
    const blob = await zip.generateAsync({ type: 'blob' });

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Read the content of an uploaded file
 */
export async function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            resolve(content);
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsText(file);
    });
}

/**
 * Detect programming language from file extension
 */
export function detectLanguage(filename: string): string {
    const LANGUAGE_MAP: Record<string, string> = {
        '.js': 'javascript',
        '.ts': 'typescript',
        '.jsx': 'javascript',
        '.tsx': 'typescript',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.less': 'less',
        '.py': 'python',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.hpp': 'cpp',
        '.cs': 'csharp',
        '.php': 'php',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.json': 'json',
        '.xml': 'xml',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.md': 'markdown',
        '.sql': 'sql',
        '.sh': 'shell',
        '.bash': 'shell',
        '.txt': 'plaintext',
    };

    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    return LANGUAGE_MAP[ext] || 'plaintext';
}
