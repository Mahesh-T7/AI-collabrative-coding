import { FileCode2, Search, GitBranch, Play, Puzzle, Settings, MessageSquare, Terminal, Users, History, Sun, Moon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

export type ActivityView = 'explorer' | 'search' | 'git' | 'debug' | 'extensions' | 'chat' | 'terminal' | 'collaborators' | 'activity';

interface ActivityBarProps {
    activeView: ActivityView | null;
    onViewChange: (view: ActivityView | null) => void;
}

export const ActivityBar = ({ activeView, onViewChange }: ActivityBarProps) => {
    const { theme, setTheme } = useTheme();

    const topItems = [
        { id: 'explorer', icon: FileCode2, label: 'Explorer' },
        { id: 'search', icon: Search, label: 'Search' },
        { id: 'git', icon: GitBranch, label: 'Source Control' },
        { id: 'debug', icon: Play, label: 'Run and Debug' },

        { id: 'chat', icon: MessageSquare, label: 'AI Chat' },
        { id: 'collaborators', icon: Users, label: 'Collaborators' },
        { id: 'activity', icon: History, label: 'Activity Log' },
    ];

    const bottomItems = [
        { id: 'terminal', icon: Terminal, label: 'Terminal' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="w-12 flex flex-col items-center py-2 bg-[hsl(var(--activity-bar-bg))] border-r border-[hsl(var(--activity-bar-border))] z-20">
            <div className="flex-1 flex flex-col gap-2 w-full px-2">
                {topItems.map((item) => {
                    const isActive = activeView === item.id;
                    const Icon = item.icon;
                    return (
                        <div key={item.id} className="relative group flex justify-center">
                            {isActive && (
                                <div className="absolute left-[-8px] top-0 bottom-0 w-[2px] bg-[hsl(var(--activity-bar-active-border))]" />
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onViewChange(item.id as ActivityView)}
                                className={cn(
                                    "w-8 h-8 rounded-md mb-1 relative",
                                    isActive
                                        ? "text-[hsl(var(--activity-bar-active-fg))]"
                                        : "text-[hsl(var(--activity-bar-fg))] hover:text-[hsl(var(--activity-bar-active-fg))]"
                                )}
                                title={item.label}
                            >
                                <Icon strokeWidth={1.5} className="w-5 h-5" />
                            </Button>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-2 w-full px-2">
                {/* Theme Toggle */}
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-8 h-8 text-[hsl(var(--activity-bar-fg))] hover:text-[hsl(var(--activity-bar-active-fg))]"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <Sun strokeWidth={1.5} className="w-5 h-5" />
                        ) : (
                            <Moon strokeWidth={1.5} className="w-5 h-5" />
                        )}
                    </Button>
                </div>

                {bottomItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.id} className="flex justify-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-[hsl(var(--activity-bar-fg))] hover:text-[hsl(var(--activity-bar-active-fg))]"
                                title={item.label}
                                onClick={() => item.id === 'terminal' && onViewChange('terminal')}
                            >
                                <Icon strokeWidth={1.5} className="w-5 h-5" />
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
