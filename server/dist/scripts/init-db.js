"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = require("../models/user.model");
dotenv_1.default.config();
const initializeDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        // Create indexes
        await user_model_1.User.collection.createIndexes([
            { key: { email: 1 }, unique: true },
            { key: { username: 1 }, unique: true },
        ]);
        console.log('Database indexes created successfully');
        // Create admin user if not exists
        const adminExists = await user_model_1.User.findOne({ role: 'admin' });
        if (!adminExists) {
            await user_model_1.User.create({
                username: 'admin',
                email: 'admin@chatbot.com',
                password: 'Admin123!',
                role: 'admin',
                isVerified: true,
                status: 'offline',
            });
            console.log('Admin user created successfully');
        }
        console.log('Database initialization completed');
        process.exit(0);
    }
    catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};
initializeDatabase();
