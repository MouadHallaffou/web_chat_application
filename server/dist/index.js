"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
// Load environment variables first
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, '../.env') });
// Debug environment variables
console.log('Environment variables loaded:', {
    hasEmailUser: !!process.env.EMAIL_USER,
    hasEmailPass: !!process.env.EMAIL_PASS,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasPort: !!process.env.PORT,
    nodeEnv: process.env.NODE_ENV
});
const app_1 = __importDefault(require("./app"));
const mongoose_1 = __importDefault(require("mongoose"));
const email_service_1 = require("./services/email.service");
const http_1 = require("http");
const socket_service_1 = require("./services/socket.service");
const startServer = async () => {
    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
        console.log('Connecting to MongoDB:', MONGODB_URI);
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        // Verify email connection (this won't block server startup)
        email_service_1.emailService.verifyConnection().catch(error => {
            console.warn('Email service is not available:', error.message);
            console.warn('The application will continue to run, but email features will not work.');
        });
        // Create HTTP server
        const PORT = process.env.PORT || 5000;
        const server = (0, http_1.createServer)(app_1.default);
        // Initialize WebSocket service
        socket_service_1.socketService.initialize(server);
        // Start server
        server.listen(Number(PORT), 'localhost', () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Health check available at: http://localhost:${PORT}/api/health`);
            console.log(`WebSocket server initialized`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
