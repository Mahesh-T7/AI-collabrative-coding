import { useEffect, useRef } from 'react';
import type { Collaborator } from '@/hooks/useRealtimeCollaboration';

import type { editor } from 'monaco-editor';

type MonacoEditor = editor.IStandaloneCodeEditor;

interface CollaboratorCursorsProps {
  editor: MonacoEditor | null;
  collaborators: Map<string, Collaborator>;
  currentFileId: string;
}

export const CollaboratorCursors = ({
  editor,
  collaborators,
  currentFileId,
}: CollaboratorCursorsProps) => {
  const decorationsRef = useRef<string[]>([]);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!editor) return;

    // Create style element for cursor colors
    if (!styleElementRef.current) {
      styleElementRef.current = document.createElement('style');
      document.head.appendChild(styleElementRef.current);
    }

    const decorations: editor.IModelDeltaDecoration[] = [];
    let styles = '';

    collaborators.forEach((collaborator) => {
      // Only show cursors for collaborators viewing the same file
      if (collaborator.currentFileId !== currentFileId) return;
      if (!collaborator.cursor) return;

      const cursorClassName = `collaborator-cursor-${collaborator.id.replace(/[^a-zA-Z0-9]/g, '')}`;
      const selectionClassName = `collaborator-selection-${collaborator.id.replace(/[^a-zA-Z0-9]/g, '')}`;

      // Add cursor decoration
      decorations.push({
        range: {
          startLineNumber: collaborator.cursor.lineNumber,
          startColumn: collaborator.cursor.column,
          endLineNumber: collaborator.cursor.lineNumber,
          endColumn: collaborator.cursor.column + 1,
        },
        options: {
          className: cursorClassName,
          beforeContentClassName: `${cursorClassName}-before`,
          hoverMessage: { value: collaborator.username },
        },
      });

      // Add selection decoration if exists
      if (collaborator.selection) {
        decorations.push({
          range: {
            startLineNumber: collaborator.selection.startLineNumber,
            startColumn: collaborator.selection.startColumn,
            endLineNumber: collaborator.selection.endLineNumber,
            endColumn: collaborator.selection.endColumn,
          },
          options: {
            className: selectionClassName,
          },
        });
      }

      // Generate CSS for this collaborator
      styles += `
        .${cursorClassName} {
          background-color: ${collaborator.color} !important;
          width: 2px !important;
        }
        .${cursorClassName}-before {
          content: '';
          position: absolute;
          top: -18px;
          left: 0;
          padding: 2px 6px;
          font-size: 10px;
          background-color: ${collaborator.color};
          color: white;
          border-radius: 3px;
          white-space: nowrap;
          z-index: 100;
        }
        .${cursorClassName}-before::after {
          content: '${collaborator.username}';
        }
        .${selectionClassName} {
          background-color: ${collaborator.color}40 !important;
        }
      `;
    });

    // Update styles
    if (styleElementRef.current) {
      styleElementRef.current.textContent = styles;
    }

    // Apply decorations
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      decorations
    );

    return () => {
      if (editor) {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      }
    };
  }, [editor, collaborators, currentFileId]);

  // Cleanup style element on unmount
  useEffect(() => {
    return () => {
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
      }
    };
  }, []);

  return null;
};
