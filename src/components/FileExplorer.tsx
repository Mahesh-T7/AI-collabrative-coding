import React, { useState, useMemo } from 'react';
import {
    FileCode,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Download,
    Trash2,
    Plus,
    Upload,
    FolderUp,
    MoreVertical,
    FileCode2,
    FileJson,
    Image as ImageIcon,
    Palette,
    Braces,
    FileType
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface File {
    _id: string;
    name: string;
    language: string;
    content: string;
}

interface FileExplorerProps {
    files: File[];
    currentFile: File | null;
    onSelectFile: (file: File) => void;
    onDeleteFile: (fileId: string) => void;
    onDownloadFile: (file: File) => void;
    onCreateFile: () => void;
    onImportFile: () => void;
    onImportFolder: () => void;
}

interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    file?: File;
    children?: Record<string, FileNode>;
    path: string;
}

const buildFileTree = (files: File[]): Record<string, FileNode> => {
    const root: Record<string, FileNode> = {};

    files.forEach(file => {
        const parts = file.name.split('/'); // Assuming forward slash separator
        let currentLevel = root;
        let currentPath = '';

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!currentLevel[part]) {
                currentLevel[part] = {
                    id: isFile ? file._id : `folder-${currentPath}`,
                    name: part,
                    type: isFile ? 'file' : 'folder',
                    path: currentPath,
                    children: isFile ? undefined : {},
                    file: isFile ? file : undefined
                };
            }

            if (!isFile) {
                currentLevel = currentLevel[part].children!;
            }
        });
    });

    return root;
};

const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();

    switch (ext) {
        case 'html':
            return { icon: FileCode, color: 'text-orange-500' };
        case 'css':
        case 'scss':
        case 'less':
            return { icon: Palette, color: 'text-blue-400' };
        case 'js':
        case 'jsx':
        case 'mjs':
            return { icon: FileJson, color: 'text-yellow-400' };
        case 'ts':
        case 'tsx':
            return { icon: FileCode2, color: 'text-blue-500' };
        case 'json':
            return { icon: Braces, color: 'text-yellow-200' };
        case 'md':
            return { icon: FileType, color: 'text-blue-300' };
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
            return { icon: ImageIcon, color: 'text-purple-400' };
        default:
            return { icon: FileCode, color: 'text-[hsl(var(--editor-text-muted))]' };
    }
};

const FileTreeItem = ({
    node,
    level,
    currentFile,
    onSelect,
    onDelete,
    onDownload
}: {
    node: FileNode;
    level: number;
    currentFile: File | null;
    onSelect: (file: File) => void;
    onDelete: (id: string) => void;
    onDownload: (file: File) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const isSelected = currentFile?._id === node.file?._id;

    // Get icon for file
    const { icon: FileIcon, color: iconColor } = node.type === 'file' ? getFileIcon(node.name) : { icon: FileCode, color: '' };

    if (node.type === 'folder') {
        return (
            <div className="select-none">
                <div
                    className={cn(
                        "flex items-center py-1 px-2 hover:bg-[hsl(var(--editor-hover))] cursor-pointer text-[hsl(var(--editor-text))] transition-colors",
                    )}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="mr-1 text-[hsl(var(--editor-text-muted))]">
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                    <span className="mr-2 text-yellow-500/80">
                        {isOpen ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                    </span>
                    <span className="text-sm truncate flex-1">{node.name}</span>
                </div>
                {isOpen && node.children && (
                    <div>
                        {Object.values(node.children)
                            .sort((a, b) => {
                                if (a.type === b.type) return a.name.localeCompare(b.name);
                                return a.type === 'folder' ? -1 : 1;
                            })
                            .map((child) => (
                                <FileTreeItem
                                    key={child.id}
                                    node={child}
                                    level={level + 1}
                                    currentFile={currentFile}
                                    onSelect={onSelect}
                                    onDelete={onDelete}
                                    onDownload={onDownload}
                                />
                            ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "group flex items-center justify-between py-1 px-2 cursor-pointer text-[hsl(var(--editor-text))] transition-colors border-l-2 border-transparent",
                isSelected
                    ? "bg-[hsl(var(--editor-hover))] border-cyan-accent text-cyan-accent"
                    : "hover:bg-[hsl(var(--editor-hover))]"
            )}
            style={{ paddingLeft: `${level * 12 + 24}px` }}
            onClick={() => node.file && onSelect(node.file)}
        >
            <div className="flex items-center gap-2 overflow-hidden">
                <FileIcon className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isSelected ? "text-cyan-accent" : iconColor
                )} />
                <span className="text-sm truncate">{node.name}</span>
            </div>

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-background/20">
                            <MoreVertical className="w-3 h-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (node.file) onDownload(node.file); }}>
                            <Download className="w-4 h-4 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="text-red-500 focus:text-red-500">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export const FileExplorer = ({
    files,
    currentFile,
    onSelectFile,
    onDeleteFile,
    onDownloadFile,
    onCreateFile,
    onImportFile,
    onImportFolder
}: FileExplorerProps) => {
    const fileTree = useMemo(() => buildFileTree(files), [files]);

    // ... imports kept same as context ... -> removed

    return (
        <div className="flex flex-col h-full bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] select-none">
            {/* VS Code Style Header */}
            <div className="h-9 px-4 flex items-center justify-between bg-[hsl(var(--sidebar-header-bg))] text-[hsl(var(--sidebar-header-fg))] text-xs font-bold uppercase tracking-wide">
                <span>Explorer</span>
                <div className="flex items-center gap-1">
                    {/* Actions can fit here or remain as before, simpler is better for VS Code look */}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-[hsl(var(--editor-hover))]"
                        onClick={onImportFile}
                        title="Import file"
                    >
                        <Upload className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-[hsl(var(--editor-hover))]"
                        onClick={onCreateFile}
                        title="New file"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto py-0">
                {/* ... content keeping logic same, just className updates in FileTreeItem if needed ... */}
                {files.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[hsl(var(--editor-text-muted))]">
                        No files found. Import or create a file to start.
                    </div>
                ) : (
                    Object.values(fileTree)
                        .sort((a, b) => {
                            if (a.type === b.type) return a.name.localeCompare(b.name);
                            return a.type === 'folder' ? -1 : 1;
                        })
                        .map((node) => (
                            <FileTreeItem
                                key={node.id}
                                node={node}
                                level={0}
                                currentFile={currentFile}
                                onSelect={onSelectFile}
                                onDelete={onDeleteFile}
                                onDownload={onDownloadFile}
                            />
                        ))
                )}
            </div>
        </div>
    );
};
