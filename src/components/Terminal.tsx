import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io, Socket } from 'socket.io-client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { ChevronDown, MoreHorizontal, X, Maximize2, Sparkles, Plus, Trash2, Split, TerminalSquare, Settings } from 'lucide-react';
import 'xterm/css/xterm.css';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface Problem {
    message: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    source?: string;
}

export type TabType = 'output' | 'problems' | 'debug' | 'terminal' | 'ports';

interface TerminalProps {
    projectId: string;
    codeOutput?: string;
    problems?: Problem[];
    defaultTab?: TabType;
    onClose?: () => void;
    onRequestFix?: (log: string) => void;
    simpleMode?: boolean;
}

interface TerminalInstance {
    id: string;
    xterm: XTerm;
    fitAddon: FitAddon;
    container: HTMLDivElement | null;
    profile: string;
}

export const Terminal = ({ projectId, codeOutput, problems = [], defaultTab = 'terminal', onClose, onRequestFix, simpleMode = false }: TerminalProps) => {
    const [activeTab, setActiveTab] = useState<TabType>(defaultTab || 'terminal');
    const [filterText, setFilterText] = useState('');

    // Multi-terminal state
    const [terminals, setTerminals] = useState<{ id: string; name: string; profile: string }[]>([{ id: '1', name: 'Terminal 1', profile: 'default' }]);
    const [activeTerminalId, setActiveTerminalId] = useState<string>('1');
    const terminalInstances = useRef<Map<string, TerminalInstance>>(new Map());
    const terminalsContainerRef = useRef<HTMLDivElement>(null);

    const socketRef = useRef<Socket | null>(null);

    // Update active tab when defaultTab changes
    useEffect(() => {
        if (defaultTab) {
            setActiveTab(defaultTab);
        }
    }, [defaultTab]);

    const createTerminalInstance = useCallback((terminalId: string, profile: string = 'default') => {
        const term = new XTerm({
            cursorBlink: true,
            theme: {
                background: '#1e1e1e',
                foreground: '#cccccc',
                cursor: '#ffffff',
                selectionBackground: '#264f78',
            },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            scrollback: 5000,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        return { xterm: term, fitAddon, id: terminalId, container: null, profile };
    }, []);

    // Initialize Socket
    useEffect(() => {
        const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api', '');
        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        socket.on('connect', async () => {
            try {
                // Sync project files to disk so they are available in terminal
                await api.post(`/files/sync/${projectId}`);
            } catch (error) {
                console.error('Failed to sync project files:', error);
            }
        });

        socket.on('terminal:output', ({ projectId: pid, terminalId, data }) => {
            if (pid === projectId) {
                const targetId = terminalId || '1';
                const instance = terminalInstances.current.get(targetId);
                if (instance) {
                    instance.xterm.write(data);
                }
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [projectId]);

    // Handle Resize with ResizeObserver
    useEffect(() => {
        const handleFit = () => {
            if (activeTab === 'terminal') {
                terminalInstances.current.forEach(instance => {
                    try {
                        instance.fitAddon.fit();
                        if (socketRef.current) {
                            socketRef.current.emit('terminal:resize', {
                                projectId,
                                terminalId: instance.id,
                                cols: instance.xterm.cols,
                                rows: instance.xterm.rows,
                            });
                        }
                    } catch (e) {
                        /* empty */
                    }
                });
            }
        };

        // Window resize
        window.addEventListener('resize', handleFit);

        // Container resize (for panel resizing)
        let resizeObserver: ResizeObserver | null = null;
        if (terminalsContainerRef.current) {
            resizeObserver = new ResizeObserver(() => {
                handleFit();
            });
            resizeObserver.observe(terminalsContainerRef.current);
        }

        setTimeout(handleFit, 100);

        return () => {
            window.removeEventListener('resize', handleFit);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, [activeTab, projectId, activeTerminalId]);


    useEffect(() => {
        if (activeTab !== 'terminal' || !terminalsContainerRef.current) return;

        terminals.forEach(t => {
            let instance = terminalInstances.current.get(t.id);
            if (!instance) {
                instance = createTerminalInstance(t.id, t.profile);
                terminalInstances.current.set(t.id, instance);

                instance.xterm.onData(data => {
                    socketRef.current?.emit('terminal:input', { projectId, terminalId: t.id, data });
                });

                socketRef.current?.emit('terminal:create', { projectId, terminalId: t.id, profile: t.profile });
            }

            let container = document.getElementById(`terminal-container-${t.id}`) as HTMLDivElement;
            if (!container) {
                container = document.createElement('div');
                container.id = `terminal-container-${t.id}`;
                container.style.height = '100%';
                container.style.width = '100%';
                terminalsContainerRef.current?.appendChild(container);
                instance.xterm.open(container);
                instance.fitAddon.fit();
                instance.container = container;
            }

            container.style.display = t.id === activeTerminalId ? 'block' : 'none';
            if (t.id === activeTerminalId) {
                setTimeout(() => {
                    try {
                        instance?.fitAddon.fit();
                        instance?.xterm.focus();
                        socketRef.current?.emit('terminal:resize', {
                            projectId,
                            terminalId: t.id,
                            cols: instance?.xterm.cols,
                            rows: instance?.xterm.rows,
                        });
                    } catch (e) { /* empty */ }
                }, 50);
            }
        });

        const currentIds = new Set(terminals.map(t => t.id));
        terminalInstances.current.forEach((inst, id) => {
            if (!currentIds.has(id)) {
                inst.xterm.dispose();
                inst.container?.remove();
                terminalInstances.current.delete(id);
                socketRef.current?.emit('terminal:destroy', { projectId, terminalId: id });
            }
        });

    }, [terminals, activeTerminalId, activeTab, createTerminalInstance, projectId]);


    const handleAddTerminal = (profile: string = 'default') => {
        const nextId = String(Date.now());
        // Simple name mapping
        let name = `Terminal ${terminals.length + 1}`;
        if (profile === 'powershell') name = 'PowerShell';
        if (profile === 'cmd') name = 'Command Prompt';
        if (profile === 'gitbash') name = 'Git Bash';
        if (profile === 'bash') name = 'Bash';

        // Prevent duplicate names if needed, but simple counter is fine for now mixed with type
        if (profile !== 'default') {
            name = `${name} (${terminals.length + 1})`;
        }

        const newTerminal = { id: nextId, name, profile };
        setTerminals([...terminals, newTerminal]);
        setActiveTerminalId(nextId);
    };

    const handleCloseTerminal = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (terminals.length <= 1) return;
        const newTerminals = terminals.filter(t => t.id !== id);
        setTerminals(newTerminals);
        if (activeTerminalId === id) {
            setActiveTerminalId(newTerminals[newTerminals.length - 1].id);
        }
    };

    const handleRequestFix = () => {
        if (!onRequestFix) return;
        let logContent = '';
        if (activeTab === 'output') {
            logContent = codeOutput || '';
        } else if (activeTab === 'terminal') {
            const instance = terminalInstances.current.get(activeTerminalId);
            if (instance) {
                if (instance.xterm.hasSelection()) {
                    logContent = instance.xterm.getSelection();
                } else {
                    // Get last 50 lines of output
                    const buffer = instance.xterm.buffer.active;
                    const lines: string[] = [];
                    const start = Math.max(0, buffer.length - 50);
                    for (let i = start; i < buffer.length; i++) {
                        lines.push(buffer.getLine(i)?.translateToString(true) || '');
                    }
                    logContent = lines.join('\n').trim();
                    if (!logContent) logContent = "Terminal is empty.";
                }
            } else {
                logContent = 'No active terminal instance found.';
            }
        }
        onRequestFix(logContent || codeOutput || "Please check the terminal.");
    };

    const tabs: { id: TabType; label: string }[] = [
        { id: 'output', label: 'Output' },
        { id: 'problems', label: 'Problems' },
        { id: 'debug', label: 'Debug Console' },
        { id: 'terminal', label: 'Terminal' },
        { id: 'ports', label: 'Ports' },
    ];

    return (
        <div className="h-full w-full flex flex-col bg-[hsl(var(--editor-bg))] border-t border-[hsl(var(--editor-border))]">
            {!simpleMode && (
                <div className="flex items-center justify-between bg-[hsl(var(--editor-group-header-bg))] border-b border-[hsl(var(--editor-border))] h-9">
                    <div className="flex items-center overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 h-9 text-xs uppercase tracking-wide font-normal transition-colors relative focus:outline-none whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "text-[hsl(var(--tab-active-fg))] bg-[hsl(var(--editor-bg))] border-t border-t-[hsl(var(--tab-active-border-top))]"
                                        : "text-[hsl(var(--tab-inactive-fg))] hover:text-[hsl(var(--tab-active-fg))]"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 px-2">
                        {activeTab === 'terminal' && (
                            <div className="flex items-center gap-1 mr-4 border-l border-r border-[#333] px-2 h-5">
                                <div className="flex items-center gap-1 max-w-[300px] overflow-hidden">
                                    {terminals.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => setActiveTerminalId(t.id)}
                                            className={cn(
                                                "flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer text-[11px] min-w-[30px]",
                                                activeTerminalId === t.id ? "bg-[#333] text-white" : "text-gray-400 hover:text-white"
                                            )}
                                            title={t.name}
                                        >
                                            <span className="truncate max-w-[80px]">{t.name}</span>
                                            {terminals.length > 1 && (
                                                <X
                                                    className="w-3 h-3 hover:text-red-400"
                                                    onClick={(e) => handleCloseTerminal(t.id, e)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-7 rounded text-gray-400 hover:text-white flex items-center justify-center gap-0.5"
                                            title="New Terminal Profile"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <ChevronDown className="w-3 h-3 opacity-70" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 bg-[#1f1f1f] border-[#333] text-gray-300">
                                        <DropdownMenuItem onClick={() => handleAddTerminal('default')} className="focus:bg-[#2a2d2e] focus:text-white cursor-pointer">
                                            <TerminalSquare className="w-4 h-4 mr-2" />
                                            <span>New Terminal</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-[#333]" />
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger className="focus:bg-[#2a2d2e] focus:text-white cursor-pointer">
                                                <span>Select Profile...</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent className="bg-[#1f1f1f] border-[#333] text-gray-300">
                                                <DropdownMenuItem onClick={() => handleAddTerminal('powershell')} className="focus:bg-[#2a2d2e] focus:text-white cursor-pointer">
                                                    <span>PowerShell</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAddTerminal('cmd')} className="focus:bg-[#2a2d2e] focus:text-white cursor-pointer">
                                                    <span>Command Prompt</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAddTerminal('gitbash')} className="focus:bg-[#2a2d2e] focus:text-white cursor-pointer">
                                                    <span>Git Bash</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAddTerminal('bash')} className="focus:bg-[#2a2d2e] focus:text-white cursor-pointer">
                                                    <span>Bash (WSL)</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator className="bg-[#333]" />
                                        <DropdownMenuItem className="focus:bg-[#2a2d2e] focus:text-white cursor-pointer">
                                            <Settings className="w-4 h-4 mr-2" />
                                            <span>Configure Terminal Settings</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}

                        {activeTab === 'output' && (
                            <Input
                                type="text"
                                placeholder="Filter"
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="h-6 w-48 text-xs bg-[hsl(var(--input))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                            />
                        )}

                        {(activeTab === 'output' || activeTab === 'terminal') && onRequestFix && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                                onClick={handleRequestFix}
                            >
                                <Sparkles className="w-3 h-3" />
                                AI Fix
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-[hsl(var(--editor-hover))] text-[hsl(var(--foreground))]"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden bg-[hsl(var(--editor-bg))] text-[hsl(var(--foreground))]">
                <div ref={terminalsContainerRef} className="h-full w-full p-1 pl-2" style={{ display: activeTab === 'terminal' ? 'block' : 'none' }}>
                    {/* Terminals are injected here */}
                </div>
                {activeTab === 'output' && (
                    <div className="h-full w-full p-4 text-sm font-mono overflow-auto whitespace-pre-wrap">
                        {codeOutput ? <div>{codeOutput}</div> : <div className="text-[hsl(var(--muted-foreground))]">No output to display</div>}
                    </div>
                )}
                {/* Other tabs omitted for brevity sake in this view but should be handled previously... 
                    Wait, I replaced the hole component. I must include all tabs.
                */}
                {activeTab === 'problems' && (
                    <div className="h-full w-full p-2 overflow-auto">
                        {problems.length === 0 ? <div className="text-[hsl(var(--muted-foreground))] p-2 text-sm">No problems detected</div> : (
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="text-left border-b border-[hsl(var(--editor-border))]">
                                        <th className="p-2">Description</th><th className="p-2 w-24">Line</th><th className="p-2 w-24">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {problems.map((p, i) => (
                                        <tr key={i} className="hover:bg-[hsl(var(--editor-hover))] border-b border-[hsl(var(--editor-border))]/50">
                                            <td className="p-2 flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${p.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />{p.message}</td>
                                            <td className="p-2">{p.line}:{p.column}</td>
                                            <td className="p-2 text-[hsl(var(--muted-foreground))]">{p.source || 'ts'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
                {activeTab === 'debug' && <div className="p-4 text-sm text-[hsl(var(--muted-foreground))]">Debug console ready</div>}
                {activeTab === 'ports' && <div className="p-4 text-sm text-[hsl(var(--muted-foreground))]">No forwarded ports</div>}
            </div>
        </div>
    );
};
