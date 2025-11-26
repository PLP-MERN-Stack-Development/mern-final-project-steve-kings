const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            // Get allowed origins from environment variable (comma-separated)
            const allowedOrigins = process.env.ALLOWED_ORIGINS 
                ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
                : [];
            
            // Also include FRONTEND_URL if set
            if (process.env.FRONTEND_URL) {
                allowedOrigins.push(process.env.FRONTEND_URL);
            }
            
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                callback(null, true);
            } else {
                callback(null, true); // Allow anyway for development
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Make io accessible in routes
app.set('io', io);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_election', (electionId) => {
        socket.join(electionId);
        console.log(`User ${socket.id} joined election ${electionId}`);
    });

    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ${socket.id} joined room ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Middleware - Dynamic CORS configuration from environment
app.use(cors({
    origin: function (origin, callback) {
        // Get allowed origins from environment variable (comma-separated)
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
            : [];
        
        // Also include FRONTEND_URL if set
        if (process.env.FRONTEND_URL) {
            allowedOrigins.push(process.env.FRONTEND_URL);
        }
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list or matches Vercel preview deployments
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.log('⚠️ CORS blocked origin:', origin);
            callback(null, true); // Allow anyway for development
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
connectDB();

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'PollSync API is running',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        version: '1.0.1'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Test endpoint to verify routes are loaded
app.get('/api/routes-test', (req, res) => {
    res.json({
        success: true,
        message: 'Routes are properly loaded',
        availableRoutes: {
            auth: '/api/auth/*',
            elections: '/api/elections/*',
            organizations: '/api/organizations/*',
            payment: '/api/payment/* (including /callback)',
            pricing: '/api/pricing/*',
            admin: '/api/admin/*'
        },
        paymentRoutes: {
            stkPush: 'POST /api/payment/stk-push',
            callback: 'POST /api/payment/callback',
            checkStatus: 'GET /api/payment/check-status/:transactionId',
            verifyTransaction: 'POST /api/payment/verify-transaction',
            kopokopoHealth: 'GET /api/payment/kopokopo-health'
        }
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/elections', require('./routes/elections'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/pricing', require('./routes/pricing'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Server updated with admin routes
