import { config } from 'dotenv';
import path from 'path';

// Load environment variables first
config({ path: path.join(__dirname, '../.env') });

// Debug environment variables
console.log('Environment variables loaded:', {
  hasEmailUser: !!process.env.EMAIL_USER,
  hasEmailPass: !!process.env.EMAIL_PASS,
  hasMongoUri: !!process.env.MONGODB_URI,
  hasPort: !!process.env.PORT,
  nodeEnv: process.env.NODE_ENV
});

import app from './app';
import mongoose from 'mongoose';
import { emailService } from './services/email.service';
import { createServer } from 'http';
import { socketService } from './services/socket.service';

const startServer = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
    console.log('Connecting to MongoDB:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Verify email connection (this won't block server startup)
    emailService.verifyConnection().catch(error => {
      console.warn('Email service is not available:', error.message);
      console.warn('The application will continue to run, but email features will not work.');
    });

    // Create HTTP server
    const PORT = process.env.PORT || 5000;
    const server = createServer(app);
    
    // Initialize WebSocket service
    socketService.initialize(server);
    
    // Start server
    server.listen(Number(PORT), 'localhost', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
      console.log(`WebSocket server initialized`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
