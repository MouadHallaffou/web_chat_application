"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const testConnection = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
        console.log('Attempting to connect to MongoDB:', MONGODB_URI);
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Successfully connected to MongoDB');
        // Test database operations
        const collections = await mongoose_1.default.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        await mongoose_1.default.connection.close();
        console.log('Connection closed');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
testConnection();
