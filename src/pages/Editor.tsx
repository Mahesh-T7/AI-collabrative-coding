import { useEffect, useState, useRef, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import type { editor, IDisposable } from 'monaco-editor';
import { io, Socket } from 'socket.io-client';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code2, Video, VideoOff, MessageSquare, Play, Sparkles, Download, Menu, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

import { useWebRTC } from '@/hooks/useWebRTC';
import { useAI } from '@/hooks/useAI';
import { VideoCall } from '@/components/VideoCall';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import { CollaboratorCursors } from '@/components/CollaboratorCursors';
import { Chat } from '@/components/Chat';
import { CollaboratorsList } from '@/components/CollaboratorsList';
import { ActivityLog } from '@/components/ActivityLog';
import { Terminal, TabType } from '@/components/Terminal';
import { AIAssistant } from '@/components/AIAssistant';
import { FileExplorer } from '@/components/FileExplorer';
import { ActivityBar, ActivityView } from '@/components/ActivityBar';
import { StatusBar } from '@/components/StatusBar';
import { EditorTabs } from '@/components/EditorTabs';

import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { downloadFile, downloadZip } from '@/lib/fileUtils';

interface File {
  _id: string;
  name: string;
  language: string;
  content: string;
}

interface Project {
  _id: string;
  name: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  '.js': 'javascript',
  '.ts': 'typescript',
  '.jsx': 'javascript',
  '.tsx': 'typescript',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.py': 'python',
  '.java': 'java',
  '.cpp': 'cpp',
  '.c': 'c',
  '.cs': 'csharp',
  '.go': 'go',
  '.rs': 'rust',
  '.php': 'php',
  '.rb': 'ruby',
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
};

const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('javascript');
  const [dialogOpen, setDialogOpen] = useState(false);

  // VS Code Layout State
  const [activeActivityView, setActiveActivityView] = useState<ActivityView | null>('explorer');
  const [showTerminal, setShowTerminal] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activeTerminalTab, setActiveTerminalTab] = useState<TabType>('terminal');
  const [codeOutput, setCodeOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [problems, setProblems] = useState<Array<{ message: string; line: number; column: number; severity: 'error' | 'warning' | 'info'; source?: string }>>([]);
  const [cursorPosition, setCursorPosition] = useState({ lineNumber: 1, column: 1 });
  const [isExporting, setIsExporting] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();

  const { toast } = useToast();
  const { generateCompletion } = useAI();
  const completionProviderRef = useRef<IDisposable | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api', '');
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('code:execution-complete', () => {
      setIsExecuting(false);
    });

    socket.on('code:error', ({ error }) => {
      setIsExecuting(false);
      toast({
        title: 'Execution Error',
        description: error,
        variant: 'destructive',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  const username = user?.email?.split('@')[0] || 'Anonymous';

  const {
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isInCall,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useWebRTC(id || '', user?._id || '');

  const {
    collaborators,
    isConnected,
    broadcastCursorPosition,
    broadcastFileChange,
    pendingChanges,
    clearPendingChanges,
    userColor,
  } = useRealtimeCollaboration(id || '', user?._id || '', username);


  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    const updateProblems = () => {
      const model = editor.getModel();
      if (model) {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const mappedProblems = markers.map(marker => ({
          message: marker.message,
          line: marker.startLineNumber,
          column: marker.startColumn,
          severity: marker.severity === monaco.MarkerSeverity.Error ? 'error' as const : 'warning' as const,
          source: marker.source
        }));
        setProblems(mappedProblems);
      }
    };

    monaco.editor.onDidChangeMarkers(updateProblems);
    updateProblems();

    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }

    completionProviderRef.current = monaco.languages.registerInlineCompletionsProvider('*', {
      provideInlineCompletions: async (model, position, context, token) => {
        await new Promise(resolve => setTimeout(resolve, 600));
        if (token.isCancellationRequested) return { items: [] };

        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        if (textUntilPosition.trim().length < 5) return { items: [] };

        try {
          const code = model.getValue();
          const suggestion = await generateCompletion({
            code,
            language: model.getLanguageId(),
            cursorPosition: model.getOffsetAt(position)
          });

          if (!suggestion) return { items: [] };

          return {
            items: [{
              insertText: suggestion,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            }]
          };
        } catch (error) {
          console.error('AI Autocomplete error:', error);
          return { items: [] };
        }
      },
      freeInlineCompletions: () => { }
    });

    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({ lineNumber: e.position.lineNumber, column: e.position.column });
      if (currentFile) {
        broadcastCursorPosition(currentFile._id, {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
      }
    });

    editor.onDidChangeCursorSelection((e) => {
      if (currentFile) {
        broadcastCursorPosition(currentFile._id, {
          lineNumber: e.selection.positionLineNumber,
          column: e.selection.positionColumn,
        });
      }
    });
  };

  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
    };
  }, []);

  // Debounce ref for broadcast
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (currentFile) {
      const newContent = value || '';
      const updatedFile = { ...currentFile, content: newContent };
      setCurrentFile(updatedFile);

      // Update the file in the files array to keep state in sync
      setFiles(prevFiles =>
        prevFiles.map(f => f._id === currentFile._id ? updatedFile : f)
      );

      // Debounce the broadcast
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        broadcastFileChange(currentFile._id, newContent);
      }, 500);
    }
  }, [currentFile, broadcastFileChange]);

  useEffect(() => {
    if (pendingChanges && currentFile && pendingChanges.fileId === currentFile._id) {
      if (pendingChanges.content !== currentFile.content) {
        setCurrentFile((prev) =>
          prev ? { ...prev, content: pendingChanges.content } : null
        );
      }
      clearPendingChanges();
    }
  }, [pendingChanges, currentFile, clearPendingChanges]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchProject = useCallback(async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load project',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [id, toast, navigate]);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await api.get(`/files/${id}`);
      const data = response.data;
      setFiles(data || []);
      if (data && data.length > 0 && !currentFile) {
        setCurrentFile(data[0]);
      }
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast, currentFile]);

  useEffect(() => {
    if (id && user) {
      fetchProject();
      fetchFiles();
    }
  }, [id, user, fetchProject, fetchFiles]);

  const createFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      const ext = '.' + newFileName.split('.').pop();
      const language = LANGUAGE_MAP[ext] || newFileLanguage;

      await api.post('/files', {
        projectId: id,
        name: newFileName,
        language,
        content: ''
      });

      toast({
        title: 'File created!',
        description: `${newFileName} has been created`,
      });
      setNewFileName('');
      setDialogOpen(false);
      fetchFiles();
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create file',
        variant: 'destructive',
      });
    }
  };

  const saveFile = async () => {
    if (!currentFile) return;

    setSaving(true);
    try {
      await api.put(`/files/file/${currentFile._id}`, {
        content: currentFile.content
      });

      toast({
        title: 'Saved!',
        description: 'File saved successfully',
      });
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save file',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Ctrl+S for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  // Execute JavaScript/TypeScript code directly in browser with console capture
  const executeJavaScript = (code: string) => {
    try {
      setIsExecuting(true);
      const logs: string[] = [];
      const customConsole = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        log: (...args: any[]) => {
          const message = args
            .map((arg) =>
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            )
            .join(' ');
          logs.push(message);
        },
      };

      const func = new Function(
        'console',
        `
        "use strict";
        ${code}
      `
      );

      func(customConsole);
      const output = logs.length > 0 ? logs.join('\n') : '(no output)';
      setCodeOutput(output);
      setShowTerminal(true);
      setActiveTerminalTab('output');
      toast({ title: 'Execution Complete', description: 'Code executed successfully' });
    } catch (err) {
      const error = err as Error;
      const errorMsg = `❌ Error: ${error.message}`;
      setCodeOutput(errorMsg);
      setShowTerminal(true);
      setActiveTerminalTab('output');
      toast({ title: 'Execution Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunCode = async () => {
    if (!currentFile) return;

    const ext = '.' + currentFile.name.split('.').pop();
    if (ext === '.js' || ext === '.jsx') {
      const isBackendFile = currentFile.name.startsWith('backend/') ||
        currentFile.name.startsWith('server/') ||
        currentFile.name.startsWith('api/');

      if (!isBackendFile) {
        executeJavaScript(currentFile.content);
        return;
      }
    }

    if (ext === '.ts' || ext === '.tsx') {
      const jsCode = currentFile.content
        .replace(/: (string|number|boolean|any|\w+\[\]|\{[^}]*\})/g, '')
        .replace(/as (const|string|number|boolean|\w+)/g, '')
        .replace(/<\w+>/g, '');
      executeJavaScript(jsCode);
      return;
    }

    if (['.py', '.java', '.c', '.cpp', '.js'].includes(ext)) {
      if (!socketRef.current) {
        toast({ title: 'Connection Error', description: 'Not connected to server', variant: 'destructive' });
        return;
      }

      setIsExecuting(true);
      if (currentFile._id) {
        try {
          await api.post('/files/disk', {
            projectId: id,
            filename: currentFile.name,
            content: currentFile.content
          });
        } catch (err) {
          console.error('Failed to save file to disk:', err);
        }
      }

      socketRef.current.emit('terminal:run-file', {
        projectId: id,
        filename: currentFile.name
      });

      setShowTerminal(true);
      setActiveTerminalTab('terminal');
      return;
    }

    if (ext === '.html') {
      const blob = new Blob([currentFile.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return;
    }

    toast({ title: 'Info', description: `Direct execution not available for ${ext} files.` });
  };

  const handleApplyCode = (code: string) => {
    if (currentFile) {
      handleEditorChange(code);
      toast({ title: 'Code Applied', description: 'AI changes applied successfully' });
    }
  };


  const { fixTerminalError } = useAI();

  const handleRequestFix = async (log: string) => {
    // Try terminal fix first
    try {
      const result = await fixTerminalError(log);
      if (result.command && result.command !== 'CODE_FIX_REQUIRED') {
        return result.command;
      }
    } catch (e) {
      console.error("AI Terminal Fix failed, falling back to panel", e);
    }

    // Fallback to side panel
    const prompt = `I have an error in my code. Please fix it.\n\nError Log:\n${log}`;
    setAiInitialMessage(prompt);
    setShowAIPanel(true);
    return;
  };


  const deleteFile = async (fileId: string) => {
    try {
      await api.delete(`/files/file/${fileId}`);
      toast({ title: 'Deleted', description: 'File deleted successfully' });
      if (currentFile?._id === fileId) setCurrentFile(null);
      fetchFiles();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete file', variant: 'destructive' });
    }
  };

  const handleDownloadFile = (file: File) => {
    try {
      downloadFile(file.name, file.content);
      toast({ title: 'Downloaded', description: `${file.name} downloaded successfully` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download file', variant: 'destructive' });
    }
  };

  const handleExportProject = async () => {
    if (files.length === 0) return;
    setIsExporting(true);
    try {
      const zipFiles = files.map(f => ({ name: f.name, content: f.content }));
      await downloadZip(zipFiles, `${project?.name || 'project'}.zip`);
      toast({ title: 'Exported', description: `Project exported as zip` });
    } catch (error) {
      toast({ title: 'Export failed', description: 'Failed to create ZIP', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    try {
      const filePromises = Array.from(uploadedFiles).map(async (file) => {
        const content = await file.text();
        const ext = '.' + file.name.split('.').pop();
        const language = LANGUAGE_MAP[ext] || 'plaintext';
        return api.post('/files', { projectId: id, name: file.name, language, content });
      });
      await Promise.all(filePromises);
      toast({ title: 'Imported', description: `${uploadedFiles.length} files imported` });
      fetchFiles();
      e.target.value = '';
    } catch (error) {
      toast({ title: 'Import failed', description: 'Failed to import files', variant: 'destructive' });
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    try {
      const filePromises = Array.from(uploadedFiles).map(async (file) => {
        if (file.name.startsWith('.') || file.webkitRelativePath.includes('/.') || file.webkitRelativePath.includes('node_modules')) return null;
        const content = await file.text();
        const ext = '.' + file.name.split('.').pop();
        const language = LANGUAGE_MAP[ext] || 'plaintext';
        const fileName = file.webkitRelativePath || file.name;
        return api.post('/files', { projectId: id, name: fileName, language, content });
      });
      await Promise.all(filePromises);
      toast({ title: 'Folder Imported', description: `Folder imported successfully` });
      fetchFiles();
      e.target.value = '';
    } catch (error) {
      toast({ title: 'Import failed', description: 'Failed to import folder', variant: 'destructive' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-accent" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm overflow-hidden">
      {/* Title Bar - Could be custom, but keeping minimal or system for now. 
            Standard VS Code has a title bar. We'll use the top strip as one. 
        */}
      {/* Main Layout: Flex Row [ActivityBar | Sidebar | Editor/Panel] */}
      <div className="flex-1 flex overflow-hidden">

        {/* Activity Bar */}
        <ActivityBar
          activeView={activeActivityView}
          onViewChange={(view) => {
            setActiveActivityView(view);
            // Switch sidebar content based on view
          }}
        />

        {/* Sidebar / Main Content Split */}
        <PanelGroup direction="horizontal">
          {/* Sidebar (FileExplorer, Search, etc) - Conditionally shown */}
          {activeActivityView && (
            <>
              <Panel defaultSize={20} minSize={15} maxSize={30} className="border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] flex flex-col">
                {/* Content based on Active View */}
                {activeActivityView === 'explorer' && (
                  <>
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept="*/*" />
                    {/* @ts-expect-error - webkitdirectory is not a standard HTML attribute but supported in modern browsers */}
                    <input ref={folderInputRef} type="file" webkitdirectory="" directory="" onChange={handleFolderUpload} className="hidden" />

                    <FileExplorer
                      files={files}
                      currentFile={currentFile}
                      onSelectFile={setCurrentFile}
                      onDeleteFile={deleteFile}
                      onDownloadFile={handleDownloadFile}
                      onCreateFile={() => setDialogOpen(true)}
                      onImportFile={() => fileInputRef.current?.click()}
                      onImportFolder={() => folderInputRef.current?.click()}
                    />
                  </>
                )}
                {activeActivityView === 'search' && (
                  <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">Search not implemented</div>
                )}
                {activeActivityView === 'git' && (
                  <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">Source Control not implemented</div>
                )}
                {activeActivityView === 'chat' && (
                  <Chat projectId={id || ''} userId={user?._id || ''} username={username} />
                )}

                {activeActivityView === 'collaborators' && (
                  <div className="p-4">
                    <h3 className="mb-4 text-xs font-bold uppercase text-[hsl(var(--editor-text-muted))]">Online Users</h3>
                    <CollaboratorsList collaborators={collaborators} isConnected={isConnected} username={username} userColor={userColor} />
                  </div>
                )}
                {activeActivityView === 'activity' && (
                  <div className="h-full flex flex-col">
                    <div className="p-4 pb-0">
                      <h3 className="mb-2 text-xs font-bold uppercase text-[hsl(var(--editor-text-muted))]">Recent Activity</h3>
                    </div>
                    <ActivityLog projectId={id || ''} />
                  </div>
                )}
              </Panel>
              <PanelResizeHandle className="w-[1px] bg-[hsl(var(--border))] hover:bg-[hsl(var(--primary))] transition-colors" />
            </>
          )}

          {/* Editor Area */}
          <Panel defaultSize={activeActivityView ? 80 : 100}>
            <main className="h-full flex flex-col bg-[hsl(var(--editor-bg))]">
              {currentFile ? (
                <>
                  {/* Editor Tabs - Top of Editor */}
                  <EditorTabs
                    files={files} // Should ideally be list of OPEN files, using all files for demo
                    activeFileId={currentFile._id}
                    onTabClick={(fileId) => {
                      const f = files.find(f => f._id === fileId);
                      if (f) setCurrentFile(f);
                    }}
                    onTabClose={(fileId, e) => {
                      // Close tab logic - for now just deselect if current
                      if (currentFile._id === fileId) setCurrentFile(null);
                    }}
                    actions={
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAIPanel(!showAIPanel)}
                          title="Toggle AI Assistant"
                          className={cn("h-7 w-7 px-0 transition-colors", showAIPanel ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20" : "hover:bg-[hsl(var(--tab-icon-hover-bg))] text-muted-foreground hover:text-foreground")}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={isInCall ? endCall : startCall}
                          title={isInCall ? "End Call" : "Start Video Call"}
                          className={cn("h-7 w-7 px-0 transition-colors", isInCall ? "text-red-500 bg-red-500/10 hover:bg-red-500/20" : "hover:bg-[hsl(var(--tab-icon-hover-bg))] text-muted-foreground hover:text-foreground")}
                        >
                          {isInCall ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleRunCode}
                          title="Run Code"
                          className="h-7 w-7 px-0 transition-colors hover:bg-[hsl(var(--tab-icon-hover-bg))] text-green-500 hover:text-green-400"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const hasRootPackage = files.some(f => f.name === 'package.json');
                            const hasBackendPackage = files.some(f => f.name === 'backend/package.json');
                            const hasFrontendPackage = files.some(f => f.name === 'frontend/package.json');

                            if ((hasRootPackage || hasBackendPackage || hasFrontendPackage) && socketRef.current) {
                              setShowTerminal(true);
                              setActiveTerminalTab('terminal');
                              // Send Ctrl+C to stop any running process
                              socketRef.current.emit('terminal:input', { projectId: id, data: '\x03' });

                              setTimeout(() => {
                                let command = 'npm start\r'; // Default

                                if (hasBackendPackage && hasFrontendPackage) {
                                  // Run both using concurrently
                                  command = 'npx -y concurrently "npm start --prefix backend" "npm run dev --prefix frontend"\r';
                                } else if (hasBackendPackage) {
                                  command = 'npm start --prefix backend\r';
                                } else if (hasFrontendPackage) {
                                  command = 'npm run dev --prefix frontend\r';
                                }

                                socketRef.current?.emit('terminal:input', { projectId: id, data: command });
                                toast({ title: 'Starting Project', description: `Running: ${command.trim()}` });
                              }, 500);
                            } else {
                              toast({ title: 'No Project Found', description: 'No package.json found. Cannot run project.', variant: 'destructive' });
                            }
                          }}
                          title="Run Project"
                          className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                        >
                          <Play className="h-4 w-4 fill-current" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={saveFile}
                          title="Save"
                          className="h-7 w-7 px-0 transition-colors hover:bg-[hsl(var(--tab-icon-hover-bg))] text-muted-foreground hover:text-foreground"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    }
                  />

                  {/* Monaco Editor */}
                  <PanelGroup direction="vertical">
                    <Panel defaultSize={showTerminal ? 60 : 100} minSize={30}>
                      <div className="h-full relative">
                        {/* Toolbar moved to EditorTabs */}


                        <MonacoEditor
                          height="100%"
                          language={currentFile.language}
                          value={currentFile.content}
                          onChange={handleEditorChange}
                          onMount={handleEditorMount}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: true },
                            fontSize: 14,
                            lineNumbers: 'on',
                            padding: { top: 16 },
                            wordWrap: 'on',
                            automaticLayout: true,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            renderWhitespace: "selection",
                          }}
                        />
                        <CollaboratorCursors editor={editorRef.current} collaborators={collaborators} currentFileId={currentFile._id} />
                      </div>
                    </Panel>

                    {/* Bottom Panel (Terminal) */}
                    {showTerminal && (
                      <>
                        <PanelResizeHandle className="h-[1px] bg-[hsl(var(--border))] hover:bg-[hsl(var(--primary))] transition-colors" />
                        <Panel defaultSize={40} minSize={5}>
                          <Terminal
                            projectId={id || ''}
                            codeOutput={codeOutput}
                            problems={problems}
                            defaultTab={activeTerminalTab}
                            onClose={() => setShowTerminal(false)}
                            onRequestFix={handleRequestFix}
                          />
                        </Panel>
                      </>
                    )}
                  </PanelGroup>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[hsl(var(--muted-foreground))]">
                  <Code2 className="w-24 h-24 opacity-20 mb-4" />
                  <p className="text-lg font-medium">No file open</p>
                  <p className="text-sm opacity-60">Select a file from the explorer to start editing</p>
                  <div className="mt-8 text-xs opacity-40">
                    <p>Ctrl/Cmd + P to search files</p>
                    <p>Ctrl/Cmd + Shift + F to search</p>
                  </div>
                </div>
              )}
            </main>
          </Panel>

          {/* AI Assistant Panel (Right Side) */}
          {showAIPanel && (
            <>
              <PanelResizeHandle className="w-[1px] bg-[hsl(var(--border))] hover:bg-[hsl(var(--primary))] transition-colors" />
              <Panel defaultSize={25} minSize={20} maxSize={40} className="bg-[hsl(var(--sidebar-background))]">
                <AIAssistant
                  currentCode={currentFile?.content || ''}
                  currentLanguage={currentFile?.language || 'javascript'}
                  selectedCode={''} // TODO: Wiring selection if needed
                  files={files}
                  onClose={() => setShowAIPanel(false)}
                  onApplyCode={handleApplyCode}
                  initialMessage={aiInitialMessage}
                  onClearInitialMessage={() => setAiInitialMessage('')}
                  projectId={id}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <StatusBar
        file={currentFile}
        cursorPosition={cursorPosition}
        problems={{ error: problems.filter(p => p.severity === 'error').length, warning: problems.filter(p => p.severity === 'warning').length }}
        isSaved={!saving}
      />

      {/* Video Call Widget (Overlay) */}
      {
        isInCall && (
          <div className="fixed bottom-10 right-10 w-80 bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--border))] shadow-2xl rounded-lg overflow-hidden z-50">
            <VideoCall
              localStream={localStream}
              remoteStreams={remoteStreams}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              isInCall={isInCall}
              onStartCall={startCall}
              onEndCall={endCall}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
            />
          </div>
        )
      }

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <form onSubmit={createFile} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="file-name">File Name</Label>
              <Input id="file-name" placeholder="index.js" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={newFileLanguage} onValueChange={setNewFileLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="javascript">React (JSX)</SelectItem>
                  <SelectItem value="typescript">React (TSX)</SelectItem>
                  <SelectItem value="vue">Vue.js</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="css">Tailwind CSS</SelectItem>
                  <SelectItem value="scss">SASS/SCSS</SelectItem>
                  <SelectItem value="less">LESS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="yaml">YAML</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="shell">Shell Script</SelectItem>
                  <SelectItem value="ruby">Ruby</SelectItem>
                  <SelectItem value="swift">Swift</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Create File</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default Editor;