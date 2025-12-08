import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

interface Presence {
  username?: string;
  color?: string;
  cursor?: CursorPosition;
  selection?: Selection;
  currentFileId?: string;
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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userColorRef = useRef<string>(getRandomColor());

  const broadcastCursorPosition = useCallback((
    fileId: string,
    cursor: CursorPosition,
    selection?: Selection
  ) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          userId,
          username,
          color: userColorRef.current,
          cursor,
          selection,
          currentFileId: fileId,
        },
      });
    }
  }, [userId, username]);

  const broadcastFileChange = useCallback((fileId: string, content: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'file-change',
        payload: {
          fileId,
          content,
          userId,
          timestamp: Date.now(),
        },
      });
    }
  }, [userId]);

  const [pendingChanges, setPendingChanges] = useState<FileChange | null>(null);

  useEffect(() => {
    if (!projectId || !userId) return;

    const channel = supabase.channel(`collab-${projectId}`, {
      config: {
        presence: { key: userId },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newCollaborators = new Map<string, Collaborator>();

        Object.entries(state).forEach(([key, presences]) => {
          if (key !== userId && presences.length > 0) {
            const presence = presences[0] as Presence;
            newCollaborators.set(key, {
              id: key,
              username: presence.username || `User ${key.slice(0, 4)}`,
              color: presence.color || getRandomColor(),
              cursor: presence.cursor,
              selection: presence.selection,
              currentFileId: presence.currentFileId,
            });
          }
        });

        setCollaborators(newCollaborators);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== userId && newPresences.length > 0) {
          const presence = newPresences[0] as Presence;
          setCollaborators(prev => {
            const newMap = new Map(prev);
            newMap.set(key, {
              id: key,
              username: presence.username || `User ${key.slice(0, 4)}`,
              color: presence.color || getRandomColor(),
            });
            return newMap;
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== userId) {
          setCollaborators(prev => {
            const newMap = new Map(prev);
            newMap.delete(key);
            return newMap;
          });
        }
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setCollaborators(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(payload.userId);
            newMap.set(payload.userId, {
              ...existing,
              id: payload.userId,
              username: payload.username,
              color: payload.color,
              cursor: payload.cursor,
              selection: payload.selection,
              currentFileId: payload.currentFileId,
            });
            return newMap;
          });
        }
      })
      .on('broadcast', { event: 'file-change' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setPendingChanges(payload as FileChange);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({
            username,
            color: userColorRef.current,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [projectId, userId, username]);

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
