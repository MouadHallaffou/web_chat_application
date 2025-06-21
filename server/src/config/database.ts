import mongoose from 'mongoose';
import { AppError } from '../middlewares/error-handler';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw new AppError(500, 'Database connection failed');
  }
};

export default connectDB; 