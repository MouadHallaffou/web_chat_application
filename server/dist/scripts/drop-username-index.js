"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const dropUsernameIndex = async () => {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        const db = mongoose_1.default.connection.db;
        const collection = db.collection('users');
        // List all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);
        // Drop the username_1 index if it exists
        try {
            await collection.dropIndex('username_1');
            console.log('Successfully dropped username_1 index');
        }
        catch (error) {
            if (error.code === 27) {
                console.log('username_1 index does not exist - no need to drop');
            }
            else {
                console.log('Error dropping index:', error.message);
            }
        }
        // List indexes after dropping
        const indexesAfter = await collection.indexes();
        console.log('Indexes after drop:', indexesAfter);
        await mongoose_1.default.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};
dropUsernameIndex();
