import { X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MouseEvent } from 'react';

interface File {
    _id: string;
    name: string;
}

interface EditorTabsProps {
    files: File[];
    activeFileId: string | null;
    onTabClick: (fileId: string) => void;
    onTabClose: (fileId: string, e: MouseEvent) => void;
    unsavedFiles?: Set<string>;
    actions?: React.ReactNode;
}

export const EditorTabs = ({ files, activeFileId, onTabClick, onTabClose, unsavedFiles = new Set(), actions }: EditorTabsProps) => {
    if (files.length === 0) return null;

    return (
        <div className="flex bg-[hsl(var(--editor-group-header-bg))] border-b border-[hsl(var(--tab-border))] overflow-x-auto no-scrollbar">
            {files.map((file) => {
                const isActive = file._id === activeFileId;
                const isUnsaved = unsavedFiles.has(file._id);

                return (
                    <div
                        key={file._id}
                        onClick={() => onTabClick(file._id)}
                        className={cn(
                            "group flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] h-[35px] text-sm cursor-pointer border-r border-[hsl(var(--tab-border))] select-none relative",
                            isActive
                                ? "bg-[hsl(var(--tab-active-bg))] text-[hsl(var(--tab-active-fg))] border-t-2 border-t-[hsl(var(--tab-active-border-top))]"
                                : "bg-[hsl(var(--tab-inactive-bg))] text-[hsl(var(--tab-inactive-fg))] hover:bg-[hsl(var(--tab-hover-bg))]"
                        )}
                    >
                        {/* File Icon Placeholder - could map extensions to icons later */}
                        <span className="truncate flex-1">{file.name}</span>

                        <div className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-[hsl(var(--tab-icon-hover-bg))]">
                            {isUnsaved ? (
                                <Circle className="w-2 h-2 fill-current text-[hsl(var(--tab-unsaved-fg))]" />
                            ) : (
                                <X
                                    className={cn("w-3.5 h-3.5 opacity-0 group-hover:opacity-100", isActive && "opacity-100")}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTabClose(file._id, e);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
            {actions && (
                <div className="ml-auto flex items-center pr-2">
                    {actions}
                </div>
            )}
        </div>
    );
};
