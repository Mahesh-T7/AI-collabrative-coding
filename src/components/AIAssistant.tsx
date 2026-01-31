import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { useAI } from '../hooks/useAI';
import {
    Sparkles,
    Send,
    Loader2,
    Bug,
    Lightbulb,
    FileText,
    X,
    Check,
    Bot,
    Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIAssistantProps {
    currentCode?: string;
    currentLanguage?: string;
    selectedCode?: string;
    files?: Array<{ name: string; content: string; language: string }>;
    onClose?: () => void;
    onApplyCode?: (code: string) => void;
    initialMessage?: string;
    onClearInitialMessage?: () => void;
    publicMode?: boolean;
    projectId?: string;
}

export const AIAssistant = ({
    currentCode = '',
    currentLanguage = 'javascript',
    selectedCode = '',
    files = [],
    onClose,
    onApplyCode,
    initialMessage,
    onClearInitialMessage,
    publicMode = false,
    projectId
}: AIAssistantProps) => {
    // Component state
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [agentMode, setAgentMode] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const {
        loading,
        chatWithAI,
        explainCode,
        detectBugs,
        suggestRefactoring,
        runAgent
    } = useAI({ usePublic: publicMode });

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
        setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
    }, []);

    const handleSendMessage = useCallback(async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText || loading) return;

        if (!text) setInput('');
        addMessage('user', messageText);

        try {
            // Heuristic to decide if we should use the Agent or Chat
            // Keywords: "create", "delete", "run", "execute", "install", "fix", "write"
            // Or just ALWAYS use the Agent if projectId is present, as the Agent can handle chat too (if implemented well).
            // But our AgentService is specialized for tools.
            // Let's use a simple heuristic for now.
            // Use agent mode if toggle is ON or if message contains agent keywords
            const hasAgentKeywords = /^(create|delete|run|execute|install|fix|write|modify|update|add)\s/i.test(messageText);
            const isAgentRequest = projectId && (agentMode || hasAgentKeywords);

            if (isAgentRequest && runAgent) {
                const result = await runAgent(messageText, projectId);
                if (result.actions && result.actions.length > 0) {
                    // Format actions with better visual hierarchy
                    const actionSummary = result.actions.map((a: { tool: string; output: string; args?: Record<string, unknown> }, idx: number) => {
                        const toolEmoji = {
                            write_file: '📝',
                            read_file: '📖',
                            update_file: '✏️',
                            delete_file: '🗑️',
                            list_dir: '📁',
                            run_command: '⚡',
                            analyze_error: '🔍',
                            search_files: '🔎'
                        }[a.tool] || '🔧';

                        return `### ${toolEmoji} Action ${idx + 1}: \`${a.tool}\`\n\n${a.output}\n`;
                    }).join('\n---\n\n');

                    addMessage('assistant', `${result.response}\n\n## 🤖 Agent Actions Executed\n\n${actionSummary}`);
                } else {
                    addMessage('assistant', result.response);
                }
            } else {
                const conversationHistory = messages.map(m => ({
                    role: m.role,
                    content: m.content
                }));

                const response = await chatWithAI({
                    message: messageText,
                    codeContext: currentCode,
                    files,
                    conversationHistory
                });

                addMessage('assistant', response);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('leaked') || errorMessage.includes('403')) {
                addMessage('assistant', '⚠️ **API Key Issue** - Your Gemini API key has been disabled. Please get a new key from [Google AI Studio](https://aistudio.google.com/app/apikey) and update your `.env` files.');
            } else {
                addMessage('assistant', `⚠️ **Error**: Sorry, I encountered an error. ${errorMessage}`);
            }
        }
    }, [input, loading, messages, chatWithAI, runAgent, currentCode, files, addMessage, projectId]);

    // Auto-send initial message if provided
    useEffect(() => {
        if (initialMessage) {
            handleSendMessage(initialMessage);
            if (onClearInitialMessage) {
                onClearInitialMessage();
            }
        }
    }, [initialMessage, handleSendMessage, onClearInitialMessage]);


    const handleExplainCode = async () => {
        const codeToExplain = selectedCode || currentCode;
        if (!codeToExplain) return;

        setActiveAction('explain');
        addMessage('user', `Explain this ${currentLanguage} code`);

        try {
            const explanation = await explainCode({
                code: codeToExplain,
                language: currentLanguage,
                files
            });
            addMessage('assistant', explanation);
        } catch (error) {
            console.error('Explain error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('leaked') || errorMessage.includes('403')) {
                addMessage('assistant', '⚠️ **API Key Issue** - Your Gemini API key has been disabled. Please get a new key from [Google AI Studio](https://aistudio.google.com/app/apikey) and update your `.env` files.');
            } else {
                addMessage('assistant', `⚠️ **Error**: ${errorMessage}`);
            }
        } finally {
            setActiveAction(null);
        }
    };

    const handleFindBugs = async () => {
        const codeToCheck = selectedCode || currentCode;
        if (!codeToCheck) return;

        setActiveAction('bugs');
        addMessage('user', `Find bugs in this ${currentLanguage} code`);

        try {
            const result = await detectBugs({
                code: codeToCheck,
                language: currentLanguage,
                files
            });

            let response = '## Bug Analysis\n\n';

            if (result.issues.length > 0) {
                response += '### Issues Found:\n';
                result.issues.forEach((issue: { line: number; severity: string; description: string }, idx: number) => {
                    response += `${idx + 1}. **Line ${issue.line}** (${issue.severity}): ${issue.description}\n`;
                });
            } else {
                response += 'No issues found! ✅\n';
            }

            if (result.fixes.length > 0) {
                response += '\n### Suggested Fixes:\n';
                result.fixes.forEach((fix: string, idx: number) => {
                    response += `${idx + 1}. ${fix}\n`;
                });
            }

            if (result.improvedCode) {
                response += `\n### Improved Code:\n\`\`\`${currentLanguage}\n${result.improvedCode}\n\`\`\``;
            }

            addMessage('assistant', response);
        } catch (error) {
            console.error('Bug detection error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('leaked') || errorMessage.includes('403')) {
                addMessage('assistant', '⚠️ **API Key Issue** - Your Gemini API key has been disabled. Please get a new key from [Google AI Studio](https://aistudio.google.com/app/apikey) and update your `.env` files.');
            } else {
                addMessage('assistant', `⚠️ **Error**: ${errorMessage}`);
            }
        } finally {
            setActiveAction(null);
        }
    };

    const handleSuggestImprovements = async () => {
        const codeToImprove = selectedCode || currentCode;
        if (!codeToImprove) return;

        setActiveAction('refactor');
        addMessage('user', `Suggest improvements for this ${currentLanguage} code`);

        try {
            const result = await suggestRefactoring({
                code: codeToImprove,
                language: currentLanguage,
                files
            });

            addMessage('assistant', result.suggestions);
        } catch (error) {
            console.error('Refactoring error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Check for specific error types
            if (errorMessage.includes('leaked') || errorMessage.includes('403')) {
                addMessage('assistant', '⚠️ **API Key Issue**\n\nYour Gemini API key has been disabled. Please:\n\n1. Get a new API key from [Google AI Studio](https://aistudio.google.com/app/apikey)\n2. Update your `.env` files with the new key\n3. Restart the application\n\nSee the console for more details.');
            } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
                addMessage('assistant', '⚠️ **Network Error**\n\nCouldn\'t connect to the AI service. Please check:\n\n1. Your internet connection\n2. The backend server is running\n3. API keys are configured correctly');
            } else {
                addMessage('assistant', `⚠️ **Error**\n\nSorry, I encountered an error while analyzing your code:\n\n${errorMessage}\n\nPlease try again or check the console for details.`);
            }
        } finally {
            setActiveAction(null);
        }
    };


    return (
        <div className="flex flex-col h-full w-full bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/30">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ring-1 transition-all duration-300 ${agentMode
                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 ring-purple-500/30 shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)]'
                        : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-cyan-500/30'
                        }`}>
                        {agentMode ? (
                            <Bot className="w-5 h-5 text-purple-400 animate-pulse" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-cyan-400" />
                        )}
                    </div>
                    <div>
                        <h2 className={`text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent ${agentMode
                            ? 'from-purple-400 to-pink-400'
                            : 'from-cyan-400 to-blue-400'
                            }`}>
                            {agentMode ? 'Autonomous Agent' : 'AI Assistant'}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {agentMode ? 'Full execution mode' : 'Powered by Gemini'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {projectId && (
                        <Button
                            variant={agentMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setAgentMode(!agentMode)}
                            className={`flex items-center gap-2 transition-all duration-300 ${agentMode
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 shadow-lg shadow-purple-500/20'
                                : 'border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10'
                                }`}
                            title="Toggle autonomous agent mode - can execute code, run commands, and modify files"
                        >
                            <Zap className={`w-3.5 h-3.5 ${agentMode ? 'text-white' : 'text-purple-400'}`} />
                            <span className="text-xs font-medium">Agent Mode</span>
                        </Button>
                    )}
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-b border-border/50 bg-card/10 backdrop-blur-sm">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExplainCode}
                        disabled={loading || !currentCode}
                        className="flex items-center gap-2 bg-background/50 border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all duration-300 whitespace-nowrap"
                    >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        Explain
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleFindBugs}
                        disabled={loading || !currentCode}
                        className="flex items-center gap-2 bg-background/50 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 whitespace-nowrap"
                    >
                        <Bug className="w-3.5 h-3.5 text-red-400" />
                        Find Bugs
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSuggestImprovements}
                        disabled={loading || !currentCode}
                        className="flex items-center gap-2 bg-background/50 border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all duration-300 whitespace-nowrap"
                    >
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                        Improve
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in duration-500">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center mb-6 ring-1 ring-cyan-500/20 shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)]">
                            <Sparkles className="w-10 h-10 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-foreground">How can I help?</h3>
                        <p className="text-sm text-muted-foreground max-w-[250px] leading-relaxed">
                            I can analyze your code, find bugs, or suggest optimizations. Just ask!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((message, idx) => (
                            <div
                                key={idx}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div
                                    className={`max-w-[90%] rounded-2xl p-4 shadow-md ${message.role === 'user'
                                        ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-tr-none'
                                        : 'bg-card border border-border/50 text-card-foreground rounded-tl-none backdrop-blur-sm'
                                        }`}
                                >
                                    {message.role === 'assistant' ? (
                                        <div className="prose prose-invert prose-sm max-w-none overflow-y-auto max-h-[400px] custom-scrollbar">
                                            <ReactMarkdown
                                                components={{
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    code({ node, inline, className, children, ...props }: any) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        const codeContent = String(children).replace(/\n$/, '');
                                                        return !inline && match ? (
                                                            <div className="rounded-lg overflow-hidden my-3 border border-border/50 shadow-lg relative group">
                                                                <div className="bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground border-b border-border/50 flex items-center justify-between">
                                                                    <span>{match[1]}</span>
                                                                    {onApplyCode && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-6 gap-1 text-[10px] hover:text-cyan-400 hover:bg-cyan-400/10"
                                                                            onClick={() => onApplyCode(codeContent)}
                                                                        >
                                                                            <Check className="w-3 h-3" />
                                                                            Apply
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                <SyntaxHighlighter
                                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                    style={vscDarkPlus as any}
                                                                    language={match[1]}
                                                                    PreTag="div"
                                                                    customStyle={{ margin: 0, borderRadius: 0 }}
                                                                    {...props}
                                                                >
                                                                    {codeContent}
                                                                </SyntaxHighlighter>
                                                            </div>
                                                        ) : (
                                                            <code className="bg-muted/50 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs" {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    },
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start animate-in fade-in duration-300">
                                <div className="bg-card border border-border/50 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border/50 bg-card/30 backdrop-blur-md">
                <div className="relative flex items-end gap-2 bg-background/50 rounded-xl border border-border/50 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all duration-300 p-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Ask about your code..."
                        className="min-h-[20px] max-h-[120px] resize-none bg-transparent border-none focus-visible:ring-0 p-2 text-sm placeholder:text-muted-foreground/50"
                        disabled={loading}
                    />
                    <Button
                        onClick={() => handleSendMessage()}
                        disabled={loading || !input.trim()}
                        size="icon"
                        className={`h-8 w-8 mb-1 rounded-lg transition-all duration-300 ${input.trim()
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 shadow-lg shadow-cyan-500/20'
                            : 'bg-muted text-muted-foreground'
                            }`}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
                <div className="text-[10px] text-center mt-2 text-muted-foreground/40">
                    AI can make mistakes. Review generated code.
                </div>
            </div>
        </div>
    );
};
