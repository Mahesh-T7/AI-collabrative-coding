import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { env } from './config/validateEnv.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import fileRoutes from './routes/files.js';
import aiRoutes from './routes/ai.js';
import activityRoutes from './routes/activity.js';
import publicRoutes from './routes/public.js';
import executionRoutes from './routes/execution.js';
import ChatService from './services/chatService.js';
import TerminalService from './services/terminalService.js';
import CodeExecutionService from './services/codeExecutionService.js';

// Connect to database
mongoose.connect(env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: [
            env.CLIENT_URL,
            "http://localhost:8080",
            "http://localhost:8081",
            "http://localhost:5173"
        ].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Initialize Services
new ChatService(io);
new TerminalService(io);
new CodeExecutionService(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', executionRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler
app.use(errorHandler);

const PORT = env.PORT;

httpServer.listen(PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Socket.io server ready`);
});
