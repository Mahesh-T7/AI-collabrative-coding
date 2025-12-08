import type { Collaborator } from '@/hooks/useRealtimeCollaboration';
import { Users } from 'lucide-react';

interface CollaboratorsListProps {
  collaborators: Map<string, Collaborator>;
  isConnected: boolean;
  userColor: string;
  username: string;
}

export const CollaboratorsList = ({
  collaborators,
  isConnected,
  userColor,
  username,
}: CollaboratorsListProps) => {
  const collaboratorArray = Array.from(collaborators.values());

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4 text-[hsl(var(--editor-text-muted))]" />
        <span className="text-xs text-[hsl(var(--editor-text-muted))]">
          {collaboratorArray.length + 1}
        </span>
      </div>
      
      <div className="flex -space-x-2">
        {/* Current user */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-[hsl(var(--editor-sidebar))]"
          style={{ backgroundColor: userColor }}
          title={`${username} (you)`}
        >
          {username.charAt(0).toUpperCase()}
        </div>
        
        {/* Other collaborators */}
        {collaboratorArray.slice(0, 4).map((collaborator) => (
          <div
            key={collaborator.id}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-[hsl(var(--editor-sidebar))]"
            style={{ backgroundColor: collaborator.color }}
            title={collaborator.username}
          >
            {collaborator.username.charAt(0).toUpperCase()}
          </div>
        ))}
        
        {collaboratorArray.length > 4 && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-[hsl(var(--editor-hover))] text-[hsl(var(--editor-text))] border-2 border-[hsl(var(--editor-sidebar))]">
            +{collaboratorArray.length - 4}
          </div>
        )}
      </div>
      
      {/* Connection status */}
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        />
        <span className="text-xs text-[hsl(var(--editor-text-muted))]">
          {isConnected ? 'Live' : 'Connecting...'}
        </span>
      </div>
    </div>
  );
};
