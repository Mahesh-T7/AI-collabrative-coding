import { useState, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface AICompletionOptions {
    code: string;
    language: string;
    cursorPosition?: number;
}

interface FileContext {
    name: string;
    content: string;
    language: string;
}

interface AIExplanationOptions {
    code: string;
    language: string;
    files?: FileContext[];
}

interface AIBugDetectionOptions {
    code: string;
    language: string;
    files?: FileContext[];
}

interface AIRefactorOptions {
    code: string;
    language: string;
    files?: FileContext[];
}

interface AIChatOptions {
    message: string;
    codeContext?: string;
    files?: FileContext[];
    conversationHistory?: Array<{ role: string; content: string }>;
}

interface AIFixErrorOptions {
    code: string;
    errorLog: string;
    language: string;
}

export const useAI = (options?: { usePublic?: boolean }) => {
    // ... existing state ...
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const abortControllerRef = useRef<AbortController | null>(null);

    const envApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5001`;
    // Strip trailing slash and /api suffix if present to ensure clean base URL
    const apiUrl = envApiUrl.replace(/\/$/, '').replace(/\/api$/, '');

    // Optional client-side OpenAI key for dev-only direct calls (must start with VITE_)
    const clientOpenAIKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    const clientModel = import.meta.env.VITE_AI_MODEL as string | undefined || 'gpt-4o-mini';

    // ... existing directOpenAI ...
    // eslint-disable-next-line @typescript-eslint/no-explicit-any


    const directOpenAI = useCallback(async (endpoint: string, body: any) => {
        // ... (keep exact same content for directOpenAI)
        if (!clientOpenAIKey) throw new Error('No client OpenAI key configured');

        const model = clientModel || 'gpt-4o-mini';

        const buildChatRequest = (messages: Array<{ role: string; content: string }>) => ({
            model,
            messages,
            max_tokens: 800,
            temperature: 0.3,
        });

        const fetchOpenAI = async (payload: unknown) => {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${clientOpenAIKey}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'OpenAI request failed');
            return data;
        };

        // ... existing endpoint mappings ...
        if (endpoint === 'fix-error') {
            const code = body.code || '';
            const errorLog = body.errorLog || '';
            const language = body.language || 'javascript';

            const prompt = `I have an error in my ${language} code.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nError Log:\n\`\`\`\n${errorLog}\n\`\`\`\n\nPlease analyze the error and provide a fix. Return a JSON object with the following structure:\n{\n    "fixedCode": "The full corrected code content",\n    "explanation": "Brief explanation of the fix"\n}`;

            const payload = buildChatRequest([
                { role: 'system', content: 'You are an expert debugger. Analyze the code and error log to provide a working fix. Return ONLY JSON.' },
                { role: 'user', content: prompt }
            ]);
            const data = await fetchOpenAI(payload);
            const content = data.choices?.[0]?.message?.content || '';
            try {
                return JSON.parse(content);
            } catch (e) {
                return { fixedCode: code, explanation: "Failed to parse AI response. " + content };
            }
        }

        if (endpoint === 'chat') {
            const message = body.message || '';
            const codeContext = body.codeContext || '';
            const files = body.files || [];
            const conversationHistory = body.conversationHistory || [];

            let fullContext = '';
            if (files.length > 0) {
                fullContext += 'Project Files:\n\n';
                files.forEach((f: FileContext) => {
                    fullContext += `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
                });
            }
            if (codeContext) {
                fullContext += `Current File Context:\n\`\`\`\n${codeContext}\n\`\`\``;
            }

            const messagesPayload: Array<{ role: string; content: string }> = [
                { role: 'system', content: 'You are an expert programming assistant. Help users with coding questions, provide explanations, and suggest solutions. Be concise and practical. You have access to the project files.' },
                ...conversationHistory.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
                { role: 'user', content: message + (fullContext ? `\n\n${fullContext}` : '') },
            ];

            const payload = buildChatRequest(messagesPayload);
            const data = await fetchOpenAI(payload);
            const content = data.choices?.[0]?.message?.content || '';
            return { response: content };
        }

        if (endpoint === 'complete') {
            const code = body.code || '';
            const language = body.language || 'javascript';
            const prompt = `You are an expert ${language} programmer. Given the following code context, suggest the next line or completion. Only return the code suggestion, no explanations.\n\nCurrent code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide a natural completion for the code at the cursor position. Return only the suggested code, nothing else.`;
            const payload = buildChatRequest([
                { role: 'system', content: 'You are a code completion assistant. Provide concise, accurate code suggestions.' },
                { role: 'user', content: prompt },
            ]);

            const data = await fetchOpenAI(payload);
            const content = data.choices?.[0]?.message?.content || '';
            return { completion: content.trim() };
        }

        if (endpoint === 'explain') {
            const code = body.code || '';
            const language = body.language || 'javascript';
            const files = body.files || [];

            let context = `Explain the following ${language} code in clear, concise terms. Focus on what it does and how it works.\n\n\`\`\`${language}\n${code}\n\`\`\``;

            if (files.length > 0) {
                context += '\n\nAdditional Project Context:\n';
                files.forEach((f: FileContext) => {
                    context += `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
                });
            }

            const payload = buildChatRequest([
                { role: 'system', content: 'You are a helpful programming tutor. Explain code clearly and concisely. Use the provided project files for context if needed.' },
                { role: 'user', content: context },
            ]);
            const data = await fetchOpenAI(payload);
            const content = data.choices?.[0]?.message?.content || '';
            return { explanation: content };
        }

        if (endpoint === 'bugs') {
            const code = body.code || '';
            const language = body.language || 'javascript';
            const files = body.files || [];

            let context = `Analyze the following ${language} code for potential bugs, errors, or issues.`;

            if (files.length > 0) {
                context += '\n\nProject Files Context:\n';
                files.forEach((f: FileContext) => {
                    context += `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
                });
            }

            context += `\n\nTarget Code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide:\n1. List of issues found\n2. Suggested fixes for each issue\n3. Improved version of the code\n\nFormat your response as JSON with this structure:\n{\n  "issues": [{"line": 1, "description": "issue description", "severity": "high"}],\n  "fixes": ["fix suggestion 1"],\n  "improvedCode": "corrected code here"\n}`;

            const payload = buildChatRequest([
                { role: 'system', content: 'You are an expert code reviewer. Identify bugs and suggest fixes. Consider cross-file dependencies.' },
                { role: 'user', content: context },
            ]);
            const data = await fetchOpenAI(payload);
            const content = data.choices?.[0]?.message?.content || '';
            try {
                const parsed = JSON.parse(content);
                return parsed;
            } catch (e) {
                return { issues: [], fixes: [], improvedCode: content };
            }
        }

        if (endpoint === 'refactor') {
            const code = body.code || '';
            const language = body.language || 'javascript';
            const files = body.files || [];

            let context = `Analyze the following ${language} code and suggest improvements for readability, performance, best practices, and structure.`;

            if (files.length > 0) {
                context += '\n\nProject Files Context:\n';
                files.forEach((f: FileContext) => {
                    context += `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
                });
            }

            context += `\n\nTarget Code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide specific suggestions and improved code.`;

            const payload = buildChatRequest([
                { role: 'system', content: 'You are a senior software engineer specializing in code refactoring and optimization. Consider the entire project context.' },
                { role: 'user', content: context },
            ]);
            const data = await fetchOpenAI(payload);
            const content = data.choices?.[0]?.message?.content || '';
            return { suggestions: content, timestamp: new Date().toISOString() };
        }

        throw new Error('Unsupported AI endpoint for direct OpenAI fallback');
    }, [clientOpenAIKey, clientModel]);

    const makeRequest = useCallback(async (endpoint: string, body: unknown) => {
        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Send Authorization header in Bearer format if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Determine endpoint URL
            // If usePublic is true, use the /api/public/ai path
            const base = options?.usePublic ? '/api/public' : '/api';
            const url = `${apiUrl}${base}/ai/${endpoint}`;

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: abortControllerRef.current.signal,
            });

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `API Error: ${response.statusText}`);
                }
                return data;
            } else {
                const text = await response.text();
                if (!response.ok) {
                    // Fallback for non-JSON errors (e.g. 404 HTML)
                    throw new Error(`API Request Failed (${response.status}): ${text.slice(0, 100)}...`);
                }
                // Should typically be JSON, but if we got here with 200 OK and no JSON, it's weird.
                console.warn('Received non-JSON response:', text.slice(0, 200));
                throw new Error('Received unexpected non-JSON response from server');
            }
        } catch (err) {
            const error = err as Error;
            // If request was aborted, don't proceed further
            if (error.name === 'AbortError') {
                return null; // Request was cancelled
            }

            // If backend is unreachable or returns network errors, and a VITE_OPENAI_API_KEY is provided,
            // attempt a direct client-side OpenAI call as a dev-only fallback.
            if (clientOpenAIKey) {
                try {
                    const direct = await directOpenAI(endpoint, body);
                    return direct;
                } catch (directErr) {
                    // fall through to show original error below
                    console.error('Direct OpenAI fallback error:', directErr);
                }
            }

            const errorMessage = error.message || 'An error occurred';
            setError(errorMessage);
            toast({
                title: 'AI Error',
                description: errorMessage,
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }, [apiUrl, toast, clientOpenAIKey, directOpenAI, options?.usePublic]);

    // ... (existing wrapper functions)
    const generateCompletion = useCallback(
        async (options: AICompletionOptions) => {
            const data = await makeRequest('complete', options);
            return data?.completion || '';
        },
        [makeRequest]
    );

    const explainCode = useCallback(
        async (options: AIExplanationOptions) => {
            const data = await makeRequest('explain', options);
            return data?.explanation || '';
        },
        [makeRequest]
    );

    const detectBugs = useCallback(
        async (options: AIBugDetectionOptions) => {
            const data = await makeRequest('bugs', options);
            return {
                issues: data?.issues || [],
                fixes: data?.fixes || [],
                improvedCode: data?.improvedCode || '',
            };
        },
        [makeRequest]
    );

    const suggestRefactoring = useCallback(
        async (options: AIRefactorOptions) => {
            const data = await makeRequest('refactor', options);
            return {
                suggestions: data?.suggestions || '',
                timestamp: data?.timestamp || new Date().toISOString(),
            };
        },
        [makeRequest]
    );

    const chatWithAI = useCallback(
        async (options: AIChatOptions) => {
            const data = await makeRequest('chat', options);
            return data?.response || '';
        },
        [makeRequest]
    );

    const fixError = useCallback(
        async (options: AIFixErrorOptions) => {
            const data = await makeRequest('fix-error', options);
            return {
                fixedCode: data?.fixedCode || '',
                explanation: data?.explanation || '',
            };
        },
        [makeRequest]
    );

    const fixTerminalError = useCallback(
        async (errorLog: string) => {
            const data = await makeRequest('fix-terminal', { errorLog });
            return {
                command: data?.command || '',
            };
        },
        [makeRequest]
    );

    return {
        loading,
        error,
        generateCompletion,
        explainCode,
        detectBugs,
        suggestRefactoring,
        chatWithAI,
        fixError,
        fixTerminalError,
        runAgent: useCallback(async (prompt: string, projectId: string) => {
            const data = await makeRequest('agent', { prompt, projectId });
            return data;
        }, [makeRequest])
    };
};
