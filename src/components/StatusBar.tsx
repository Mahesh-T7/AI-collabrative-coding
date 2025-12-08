import { GitBranch, AlertCircle, AlertTriangle, Check, XCircle, Zap } from 'lucide-react';

interface StatusBarProps {
    file: {
        language: string;
    } | null;
    cursorPosition: {
        lineNumber: number;
        column: number;
    };
    problems: {
        error: number;
        warning: number;
    };
    isSaved: boolean;
}

export const StatusBar = ({ file, cursorPosition, problems, isSaved }: StatusBarProps) => {
    return (
        <div className="h-6 min-h-[24px] bg-[hsl(var(--status-bar-bg))] text-[hsl(var(--status-bar-fg))] flex items-center justify-between px-3 text-xs select-none border-t border-[hsl(var(--status-bar-border))]">
            <div className="flex items-center gap-4 h-full">
                {/* Source Control Section */}
                <div className="flex items-center gap-1 hover:bg-[hsl(var(--status-bar-item-hover))] px-1 h-full cursor-pointer transition-colors">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>main</span>
                </div>

                {/* Problems Section */}
                <div className="flex items-center gap-3 px-1 h-full cursor-pointer hover:bg-[hsl(var(--status-bar-item-hover))] transition-colors">
                    <div className="flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{problems.error}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{problems.warning}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 h-full">
                {/* Cursor Position */}
                <div className="flex items-center gap-1 px-1 h-full cursor-pointer hover:bg-[hsl(var(--status-bar-item-hover))] transition-colors">
                    <span>Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}</span>
                </div>

                {/* Indentation */}
                <div className="flex items-center gap-1 px-1 h-full cursor-pointer hover:bg-[hsl(var(--status-bar-item-hover))] transition-colors">
                    <span>Spaces: 2</span>
                </div>

                {/* Encoding */}
                <div className="flex items-center gap-1 px-1 h-full cursor-pointer hover:bg-[hsl(var(--status-bar-item-hover))] transition-colors">
                    <span>UTF-8</span>
                </div>

                {/* Language */}
                {file && (
                    <div className="flex items-center gap-1 px-1 h-full cursor-pointer hover:bg-[hsl(var(--status-bar-item-hover))] transition-colors uppercase">
                        <span>{file.language === 'javascript' ? 'JavaScript' : file.language}</span>
                    </div>
                )}

                {/* Saved Status */}
                <div className="flex items-center gap-1 px-1 h-full">
                    {isSaved ? <span className="opacity-0">Saved</span> : <div className="w-2 h-2 rounded-full bg-white opacity-50" />}
                </div>
            </div>
        </div>
    );
};
