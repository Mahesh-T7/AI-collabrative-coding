import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    _id: string;
    projectId: string;
    userId: string;
    username: string;
    content: string;
    type: 'text' | 'code' | 'system';
    timestamp: Date;
    isEdited: boolean;
}

interface TypingUser {
    username: string;
    isTyping: boolean;
}

export const useChat = (projectId: string, userId: string, username: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Connect to Socket.io server
        const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api', '');
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to chat server');
            setIsConnected(true);

            // Join project chat room
            socket.emit('chat:join', { projectId, userId, username });
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
            setIsConnected(false);
        });

        // Receive chat history
        socket.on('chat:history', (history: Message[]) => {
            setMessages(history);
        });

        // Receive new message
        socket.on('chat:message', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Handle typing indicator
        socket.on('chat:typing', ({ username: typingUsername, isTyping }: TypingUser) => {
            setTypingUsers((prev) => {
                if (isTyping) {
                    return prev.includes(typingUsername) ? prev : [...prev, typingUsername];
                } else {
                    return prev.filter((name) => name !== typingUsername);
                }
            });
        });

        // Handle user joined
        socket.on('chat:user-joined', ({ username: joinedUsername }) => {
            const systemMessage: Message = {
                _id: `system-${Date.now()}`,
                projectId,
                userId: 'system',
                username: 'System',
                content: `${joinedUsername} joined the chat`,
                type: 'system',
                timestamp: new Date(),
                isEdited: false,
            };
            setMessages((prev) => [...prev, systemMessage]);
        });

        // Handle user left
        socket.on('chat:user-left', ({ username: leftUsername }) => {
            const systemMessage: Message = {
                _id: `system-${Date.now()}`,
                projectId,
                userId: 'system',
                username: 'System',
                content: `${leftUsername} left the chat`,
                type: 'system',
                timestamp: new Date(),
                isEdited: false,
            };
            setMessages((prev) => [...prev, systemMessage]);
        });

        socket.on('chat:error', ({ message }) => {
            console.error('Chat error:', message);
        });

        return () => {
            socket.disconnect();
        };
    }, [projectId, userId, username]);

    const sendMessage = (content: string, type: 'text' | 'code' = 'text') => {
        if (!socketRef.current || !content.trim()) return;

        socketRef.current.emit('chat:message', {
            projectId,
            userId,
            username,
            content: content.trim(),
            type,
        });
    };

    const sendTypingIndicator = (isTyping: boolean) => {
        if (!socketRef.current) return;

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        socketRef.current.emit('chat:typing', {
            projectId,
            username,
            isTyping,
        });

        // Auto-stop typing after 3 seconds
        if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current?.emit('chat:typing', {
                    projectId,
                    username,
                    isTyping: false,
                });
            }, 3000);
        }
    };

    return {
        messages,
        typingUsers,
        isConnected,
        sendMessage,
        sendTypingIndicator,
    };
};
