import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { History, FilePlus, FileEdit, FileMinus, FolderPlus, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Activity {
    _id: string;
    userId: {
        username: string;
        email: string;
        avatarUrl?: string;
    };
    action: string;
    details: string;
    createdAt: string;
}

interface ActivityLogProps {
    projectId: string;
}

export const ActivityLog = ({ projectId }: ActivityLogProps) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await api.get(`/activity/${projectId}`);
                setActivities(response.data);
            } catch (error) {
                console.error('Failed to load activity log:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [projectId]);

    const getIcon = (action: string) => {
        switch (action) {
            case 'CREATE_FILE':
                return <FilePlus className="w-4 h-4 text-green-500" />;
            case 'UPDATE_FILE':
                return <FileEdit className="w-4 h-4 text-blue-500" />;
            case 'DELETE_FILE':
                return <FileMinus className="w-4 h-4 text-red-500" />;
            case 'CREATE_PROJECT':
                return <FolderPlus className="w-4 h-4 text-purple-500" />;
            default:
                return <History className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-accent" />
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center p-4 text-muted-foreground text-sm">
                No activity recorded yet.
            </div>
        );
    }

    return (
        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity._id} className="flex gap-3 items-start">
                        <Avatar className="w-8 h-8 border border-border">
                            <AvatarImage src={activity.userId.avatarUrl} />
                            <AvatarFallback className="text-xs">
                                {activity.userId.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-[hsl(var(--editor-text))]">
                                    {activity.userId.username}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {getIcon(activity.action)}
                                <span>{activity.details}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};
