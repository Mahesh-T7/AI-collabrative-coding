import Message from '../models/Message.js';

class ChatService {
    constructor(io) {
        this.io = io;
        this.setupChatHandlers();
    }

    setupChatHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Chat client connected:', socket.id);

            // Join project chat room
            socket.on('chat:join', async ({ projectId, userId, username }) => {
                try {
                    socket.join(`chat:${projectId}`);
                    socket.projectId = projectId;
                    socket.userId = userId;
                    socket.username = username;

                    // Send recent chat history
                    const messages = await Message.find({ projectId })
                        .sort({ timestamp: -1 })
                        .limit(50)
                        .lean();

                    socket.emit('chat:history', messages.reverse());

                    // Notify others that user joined
                    socket.to(`chat:${projectId}`).emit('chat:user-joined', {
                        username,
                        timestamp: new Date()
                    });

                    console.log(`User ${username} joined chat for project ${projectId}`);
                } catch (error) {
                    console.error('Error joining chat:', error);
                    socket.emit('chat:error', { message: 'Failed to join chat' });
                }
            });

            // Handle new message
            socket.on('chat:message', async (data) => {
                try {
                    const { projectId, userId, username, content, type = 'text' } = data;

                    // Save message to database
                    const message = new Message({
                        projectId,
                        userId,
                        username,
                        content,
                        type
                    });

                    await message.save();

                    // Broadcast to all users in the project
                    this.io.to(`chat:${projectId}`).emit('chat:message', {
                        _id: message._id,
                        projectId: message.projectId,
                        userId: message.userId,
                        username: message.username,
                        content: message.content,
                        type: message.type,
                        timestamp: message.timestamp,
                        isEdited: message.isEdited
                    });

                    console.log(`Message sent in project ${projectId} by ${username}`);
                } catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('chat:error', { message: 'Failed to send message' });
                }
            });

            // Handle typing indicator
            socket.on('chat:typing', ({ projectId, username, isTyping }) => {
                socket.to(`chat:${projectId}`).emit('chat:typing', {
                    username,
                    isTyping
                });
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                if (socket.projectId && socket.username) {
                    socket.to(`chat:${socket.projectId}`).emit('chat:user-left', {
                        username: socket.username,
                        timestamp: new Date()
                    });
                }
                console.log('Chat client disconnected:', socket.id);
            });
        });
    }

    // Get chat history for a project
    async getChatHistory(projectId, limit = 50) {
        try {
            const messages = await Message.find({ projectId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();
            return messages.reverse();
        } catch (error) {
            console.error('Error fetching chat history:', error);
            throw error;
        }
    }

    // Delete message (optional feature)
    async deleteMessage(messageId, userId) {
        try {
            const message = await Message.findOne({ _id: messageId, userId });
            if (!message) {
                throw new Error('Message not found or unauthorized');
            }
            await message.deleteOne();
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }
}

export default ChatService;
