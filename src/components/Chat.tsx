import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Code2, Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatProps {
    projectId: string;
    userId: string;
    username: string;
}

export const Chat = ({ projectId, userId, username }: ChatProps) => {
    const { messages, typingUsers, isConnected, sendMessage, sendTypingIndicator } = useChat(
        projectId,
        userId,
        username
    );
    const [inputValue, setInputValue] = useState('');
    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            const { scrollHeight, scrollTop, clientHeight } = scrollRef.current;
            // Only auto-scroll if we are already near the bottom or if it's a new message
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

            if (isNearBottom) {
                scrollRef.current.scrollTop = scrollHeight;
            }
        }
    }, [messages]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollHeight, scrollTop, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            setShowScrollButton(false);
        }
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        sendMessage(inputValue, 'text');
        setInputValue('');
        sendTypingIndicator(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);

        // Send typing indicator
        if (e.target.value.length > 0) {
            sendTypingIndicator(true);
        } else {
            sendTypingIndicator(false);
        }
    };

    const formatTime = (timestamp: Date) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-[hsl(var(--editor-sidebar))]">
            {/* Header */}
            <div className="p-3 border-b border-[hsl(var(--editor-border))] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[hsl(var(--editor-text))]">Chat</h3>
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        isConnected ? "bg-green-500" : "bg-red-500"
                    )} />
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                <div className="space-y-3">
                    {messages.map((message) => (
                        <div
                            key={message._id}
                            className={cn(
                                "flex flex-col gap-1",
                                message.type === 'system' && "items-center"
                            )}
                        >
                            {message.type === 'system' ? (
                                <div className="text-xs text-[hsl(var(--editor-text-muted))] italic">
                                    {message.content}
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn(
                                            "text-sm font-semibold",
                                            message.userId === userId
                                                ? "text-cyan-accent"
                                                : "text-[hsl(var(--editor-text))]"
                                        )}>
                                            {message.username}
                                        </span>
                                        <span className="text-xs text-[hsl(var(--editor-text-muted))]">
                                            {formatTime(message.timestamp)}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "text-sm p-2 rounded-lg max-w-[85%]",
                                        message.userId === userId
                                            ? "bg-cyan-accent/10 border border-cyan-accent/20 self-end"
                                            : "bg-[hsl(var(--editor-hover))] self-start"
                                    )}>
                                        <div className="text-[hsl(var(--editor-text))] whitespace-pre-wrap break-words prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    code({ node, inline, className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return !inline && match ? (
                                                            <SyntaxHighlighter
                                                                style={vscDarkPlus}
                                                                language={match[1]}
                                                                PreTag="div"
                                                                {...props}
                                                            >
                                                                {String(children).replace(/\n$/, '')}
                                                            </SyntaxHighlighter>
                                                        ) : (
                                                            <code className={cn(className, "bg-black/30 rounded px-1")} {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    },
                                                    p({ children }) {
                                                        // Handle mentions in text
                                                        const text = String(children);
                                                        // Simple regex for @mentions - this is a basic implementation
                                                        // For a robust solution, we'd need to parse the children array
                                                        return <p className="m-0">{children}</p>;
                                                    }
                                                }}
                                            >
                                                {message.content.replace(/@(\w+)/g, '**@$1**')}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {/* Typing indicators */}
                    {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-[hsl(var(--editor-text-muted))] italic">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>
                                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                            </span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Scroll to bottom button */}
            {
                showScrollButton && (
                    <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-20 right-8 rounded-full shadow-lg h-8 w-8 bg-cyan-accent hover:bg-cyan-accent/90 text-background"
                        onClick={scrollToBottom}
                    >
                        <ArrowDown className="w-4 h-4" />
                    </Button>
                )
            }

            {/* Input */}
            <div className="p-3 border-t border-[hsl(var(--editor-border))]">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInputValue(prev => prev + ' ```\n\n```')}
                        className="flex-shrink-0"
                        title="Insert code block"
                    >
                        <Code2 className="w-4 h-4" />
                    </Button>
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message... (@mention, ```code```)"
                        className="flex-1 bg-[hsl(var(--editor-bg))] border-[hsl(var(--editor-border))] text-[hsl(var(--editor-text))]"
                        disabled={!isConnected}
                    />
                    <Button
                        size="sm"
                        onClick={handleSend}
                        disabled={!inputValue.trim() || !isConnected}
                        className="flex-shrink-0 bg-gradient-to-r from-cyan-accent to-cyan-accent-glow hover:opacity-90"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                {!isConnected && (
                    <div className="text-xs text-red-500 mt-1">Disconnected from chat server</div>
                )}
            </div>
        </div >
    );
};
