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

// Connect to database with timeout settings
mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    connectTimeoutMS: 10000,
})
    .then(() => console.log('✓ MongoDB Connected'))
    .catch(err => {
        console.error('✗ MongoDB Connection Error:', err.message);
        console.error('  Please check your MongoDB URI and network connection');
        console.error('  Server will continue running but database operations will fail');
    });

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

// Middleware - CORS Configuration
app.use(cors({
    origin: [
        env.CLIENT_URL,
        "https://ai-collabrative-coding-git-main-mahesh-ts-projects.vercel.app",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5173"
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Root route - Test endpoint
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

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
