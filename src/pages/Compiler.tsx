import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { AIAssistant } from '@/components/AIAssistant';
import {
    Play,
    Sparkles,
    RotateCcw,
    ChevronLeft
} from 'lucide-react';
import {
    SiPython,
    SiJavascript,
    SiTypescript,
    SiCplusplus,
    SiC,
    SiGo,
    SiRust,
    SiRuby,
    SiPhp
} from 'react-icons/si';
import { FaJava } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const LANGUAGES = [
    { id: 'python', name: 'Python', ext: '.py', icon: SiPython, color: 'text-yellow-400' },
    { id: 'javascript', name: 'JavaScript', ext: '.js', icon: SiJavascript, color: 'text-yellow-300' },
    { id: 'typescript', name: 'TypeScript', ext: '.ts', icon: SiTypescript, color: 'text-blue-400' },
    { id: 'java', name: 'Java', ext: '.java', icon: FaJava, color: 'text-red-400' },
    { id: 'cpp', name: 'C++', ext: '.cpp', icon: SiCplusplus, color: 'text-blue-500' },
    { id: 'c', name: 'C', ext: '.c', icon: SiC, color: 'text-blue-300' },
    { id: 'go', name: 'Go', ext: '.go', icon: SiGo, color: 'text-cyan-400' },
    { id: 'rust', name: 'Rust', ext: '.rs', icon: SiRust, color: 'text-orange-500' },
    { id: 'ruby', name: 'Ruby', ext: '.rb', icon: SiRuby, color: 'text-red-500' },
    { id: 'php', name: 'PHP', ext: '.php', icon: SiPhp, color: 'text-indigo-400' },
];

const DEFAULT_CODE = {
    python: 'print("Hello, AI Compiler!")\n\n# Try asking AI to optimize this code',
    javascript: 'console.log("Hello, AI Compiler!");\n\n// Try asking AI to explain this code',
    typescript: 'const greeting: string = "Hello, AI Compiler!";\nconsole.log(greeting);\n\n// Try asking AI to explain this code',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, AI Compiler!");\n    }\n}',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, AI Compiler!" << std::endl;\n    return 0;\n}',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, AI Compiler!\\n");\n    return 0;\n}',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, AI Compiler!")\n}',
    rust: 'fn main() {\n    println!("Hello, AI Compiler!");\n}',
    ruby: 'puts "Hello, AI Compiler!"',
    php: '<?php\necho "Hello, AI Compiler!";\n?>'
};

const Compiler = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // State
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState(DEFAULT_CODE['python']);
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState('');
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [aiInitialMessage, setAiInitialMessage] = useState('');
    const [editorReady, setEditorReady] = useState(false);
    const [stdin, setStdin] = useState('');

    // Ref for Monaco Editor
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput('Executing...');

        try {
            const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api', '');
            const url = `${baseUrl}/api/execute`;

            const response = await axios.post(url, {
                language,
                code,
                stdin
            });

            const { output: result, error } = response.data;

            if (error) {
                setOutput(typeof error === 'string' ? error : JSON.stringify(error));
            } else {
                setOutput(result || 'No output');
            }

        } catch (error) {
            console.error(error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const msg = (error as any).response?.data?.error || (error as any).message;
            setOutput(`Error: ${msg}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleLanguageChange = (val: string) => {
        setLanguage(val);
        setCode(DEFAULT_CODE[val as keyof typeof DEFAULT_CODE] || '');
        setOutput('');
        // Refocus editor after language change
        setTimeout(() => {
            editorRef.current?.focus();
        }, 100);
    };

    const handleApplyCode = (newCode: string) => {
        setCode(newCode);
        toast({ title: 'Code Applied' });
    };

    // Handle Monaco Editor Mount
    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;
        setEditorReady(true);
        // Auto-focus the editor
        editor.focus();
    };

    // AI Fix Request
    const handleRequestFix = () => {
        if (!output) return;
        const prompt = `I have an error/issue in my code output. Please fix it.\n\nCode:\n${code}\n\nOutput/Error:\n${output}`;
        setAiInitialMessage(prompt);
        setShowAIPanel(true);
    };

    const selectedLangObj = LANGUAGES.find(l => l.id === language);

    return (
        <div className="flex h-screen bg-[#1e1e1e] text-gray-300">
            {/* Sidebar */}
            <div className="w-16 bg-[#252526] border-r border-[#3e3e42] flex flex-col items-center py-4 gap-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mb-4 text-gray-400 hover:text-white">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Back to Home</TooltipContent>
                    </Tooltip>

                    {LANGUAGES.map((lang) => (
                        <Tooltip key={lang.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleLanguageChange(lang.id)}
                                    className={cn(
                                        "w-10 h-10 rounded-xl transition-all",
                                        language === lang.id
                                            ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50"
                                            : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                    )}
                                >
                                    <lang.icon className={cn("w-5 h-5", lang.color)} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">{lang.name}</TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="h-14 bg-[#1e1e1e] border-b border-[#3e3e42] flex items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-400">main{selectedLangObj?.ext}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAIPanel(!showAIPanel)}
                            className={cn(
                                "gap-2 transition-colors",
                                showAIPanel ? "text-cyan-400 bg-cyan-400/10" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Sparkles className="w-4 h-4" />
                            AI Assistant
                        </Button>

                        <div className="h-4 w-px bg-[#3e3e42]" />

                        <Button
                            size="sm"
                            onClick={handleRunCode}
                            disabled={isRunning}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px] gap-2 font-medium"
                        >
                            {isRunning ? (
                                <Sparkles className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4 fill-current" />
                            )}
                            Run
                        </Button>
                    </div>
                </div>

                {/* Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Editor Pane */}
                    <div className={cn("transition-all duration-300 border-r border-[#3e3e42] relative", showAIPanel ? "w-[40%]" : "w-[50%]")}>
                        {!editorReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
                                <div className="flex flex-col items-center gap-3">
                                    <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                                    <span className="text-sm text-gray-400">Loading Editor...</span>
                                </div>
                            </div>
                        )}
                        <MonacoEditor
                            height="100%"
                            language={language}
                            value={code}
                            onChange={(val) => setCode(val || '')}
                            onMount={handleEditorDidMount}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 20 },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        />
                    </div>

                    {/* Output Pane (Simple Text Display) */}
                    <div className={cn("flex-1 flex flex-col bg-[#1e1e1e]", showAIPanel ? "w-[30%]" : "w-[50%]")}>
                        {/* Input Section */}
                        <div className="border-b border-[#3e3e42]">
                            <div className="h-9 bg-[#252526] flex items-center justify-between px-4">
                                <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Input (stdin)</span>
                            </div>
                            <textarea
                                value={stdin}
                                onChange={(e) => setStdin(e.target.value)}
                                placeholder="Enter input values (one per line)&#10;Example:&#10;5&#10;10"
                                className="w-full h-24 px-4 py-2 bg-[#1e1e1e] text-gray-300 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        {/* Output Section */}
                        <div className="flex-1 flex flex-col">
                            <div className="h-9 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between px-4">
                                <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Output</span>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                                        onClick={handleRequestFix}
                                        disabled={!output}
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Fix Output
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-gray-500 hover:text-white gap-1.5"
                                        onClick={() => setOutput('')}
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Clear
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 p-4 overflow-auto bg-[#1e1e1e] font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                {output || <span className="text-gray-600 italic">Click Run to see output...</span>}
                            </div>
                        </div>
                    </div>

                    {/* AI Panel */}
                    {showAIPanel && (
                        <div className="w-[30%] border-l border-[#3e3e42] bg-[#1e1e1e]">
                            <AIAssistant
                                currentCode={code}
                                currentLanguage={language}
                                onClose={() => setShowAIPanel(false)}
                                onApplyCode={handleApplyCode}
                                initialMessage={aiInitialMessage}
                                onClearInitialMessage={() => setAiInitialMessage('')}
                                publicMode={true}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Compiler;
