import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

interface CursorPosition {
  lineNumber: number;
  column: number;
}

interface Selection {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface Collaborator {
  id: string;
  username: string;
  color: string;
  cursor?: CursorPosition;
  selection?: Selection;
  currentFileId?: string;
}

interface FileChange {
  fileId: string;
  content: string;
  userId: string;
  timestamp: number;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const useRealtimeCollaboration = (
  projectId: string,
  userId: string,
  username: string
) => {
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const userColorRef = useRef<string>(getRandomColor());
  const socket = useSocket();

  const broadcastCursorPosition = useCallback((
    fileId: string,
    cursor: CursorPosition,
    selection?: Selection
  ) => {
    if (socket) {
      socket.emit('cursor-move', {
        projectId,
        userId,
        username,
        color: userColorRef.current,
        cursor,
        selection,
        currentFileId: fileId,
      });
    }
  }, [socket, projectId, userId, username]);

  const broadcastFileChange = useCallback((fileId: string, content: string) => {
    if (socket) {
      socket.emit('file-change', {
        projectId,
        userId,
        fileId,
        content,
        timestamp: Date.now(),
      });
    }
  }, [socket, projectId, userId]);

  const [pendingChanges, setPendingChanges] = useState<FileChange | null>(null);

  useEffect(() => {
    if (!socket || !projectId || !userId) return;

    // Join project room
    socket.emit('join-project', { projectId, userId, username, color: userColorRef.current });
    setIsConnected(true);

    socket.on('collaborator-joined', (data: Collaborator) => {
      setCollaborators(prev => {
        const newMap = new Map(prev);
        newMap.set(data.id, data);
        return newMap;
      });
    });

    socket.on('collaborator-left', (id: string) => {
      setCollaborators(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    });

    socket.on('cursor-update', (data: Collaborator) => {
      if (data.id !== userId) {
        setCollaborators(prev => {
          const newMap = new Map(prev);
          newMap.set(data.id, {
            ...newMap.get(data.id)!,
            ...data
          });
          return newMap;
        });
      }
    });

    socket.on('file-update', (data: FileChange) => {
      if (data.userId !== userId) {
        setPendingChanges(data);
      }
    });

    socket.on('project-users', (users: Collaborator[]) => {
      const newMap = new Map();
      users.forEach(u => {
        if (u.id !== userId) newMap.set(u.id, u);
      });
      setCollaborators(newMap);
    });

    return () => {
      socket.emit('leave-project', { projectId, userId });
      socket.off('collaborator-joined');
      socket.off('collaborator-left');
      socket.off('cursor-update');
      socket.off('file-update');
      socket.off('project-users');
      setIsConnected(false);
    };
  }, [socket, projectId, userId, username]);

  return {
    collaborators,
    isConnected,
    broadcastCursorPosition,
    broadcastFileChange,
    pendingChanges,
    clearPendingChanges: () => setPendingChanges(null),
    userColor: userColorRef.current,
  };
};
