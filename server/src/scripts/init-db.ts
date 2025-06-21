import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model';

dotenv.config();

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Create indexes
    await User.collection.createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { username: 1 }, unique: true },
    ]);

    console.log('Database indexes created successfully');

    // Create admin user if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
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
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase(); 