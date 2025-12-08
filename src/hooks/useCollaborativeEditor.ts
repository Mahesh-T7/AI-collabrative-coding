import { useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

interface UseCollaborativeEditorProps {
  projectId: string;
  fileId: string;
  onContentChange: (content: string) => void;
}

export const useCollaborativeEditor = ({
  projectId,
  fileId,
  onContentChange,
}: UseCollaborativeEditorProps) => {
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);

  const initializeYjs = useCallback(() => {
    try {
      // Create a new Yjs document
      if (!docRef.current) {
        docRef.current = new Y.Doc();
      }

      const doc = docRef.current;

      // Create a WebRTC provider for peer-to-peer sync
      // Room name is based on project and file ID
      const roomName = `${projectId}-${fileId}`;

      if (providerRef.current) {
        providerRef.current.disconnect();
      }

      providerRef.current = new WebrtcProvider(roomName, doc);

      // Get the shared text type
      yTextRef.current = doc.getText('editor');

      // Listen for changes from other collaborators
      const observer = () => {
        const content = yTextRef.current!.toString();
        onContentChange(content);
      };

      yTextRef.current.observe(observer);

      console.log(`[Yjs] Initialized collaborative editing for room: ${roomName}`);

      return {
        yText: yTextRef.current,
        provider: providerRef.current,
      };
    } catch (error) {
      console.error('[Yjs] Initialization error:', error);
      return null;
    }
  }, [projectId, fileId, onContentChange]);

  const updateContent = useCallback((newContent: string) => {
    if (!yTextRef.current) return;

    const currentContent = yTextRef.current.toString();

    if (newContent === currentContent) return;

    try {
      // Clear and insert new content
      yTextRef.current.delete(0, currentContent.length);
      yTextRef.current.insert(0, newContent);
    } catch (error) {
      console.error('[Yjs] Update error:', error);
    }
  }, []);

  const getContent = useCallback(() => {
    return yTextRef.current?.toString() || '';
  }, []);

  useEffect(() => {
    initializeYjs();

    return () => {
      // Cleanup on unmount
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current = null;
      }
      if (docRef.current) {
        docRef.current.destroy();
        docRef.current = null;
      }
    };
  }, [initializeYjs]);

  return {
    updateContent,
    getContent,
    isConnected: providerRef.current ? true : false,
  };
};
