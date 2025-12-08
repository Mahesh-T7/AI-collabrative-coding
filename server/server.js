import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import fileRoutes from './routes/files.js';
import aiRoutes from './routes/ai.js';
import activityRoutes from './routes/activity.js';
import publicRoutes from './routes/public.js';
import executionRoutes from './routes/execution.js';
import ChatService from './services/chatService.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: [
            process.env.CLIENT_URL,
            "http://localhost:8080",
            "http://localhost:8081",
            "http://localhost:5173"
        ].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Initialize Chat Service
new ChatService(io);

// Initialize Terminal Service
import TerminalService from './services/terminalService.js';
new TerminalService(io);

// Initialize Code Execution Service
import CodeExecutionService from './services/codeExecutionService.js';
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
app.use('/api', executionRoutes); // Mounts execute at /api/execute

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Socket.io server ready`);
});
