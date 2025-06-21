import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

const testConnection = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
    console.log('Attempting to connect to MongoDB:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB');
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

testConnection(); 