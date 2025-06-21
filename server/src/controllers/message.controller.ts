import { Request, Response, NextFunction } from 'express';
import { Message } from '../models/message.model';
import { AppError } from '../middlewares/error-handler';
import { socketService } from '../services/socket.service';
import mongoose from 'mongoose';

const MESSAGES_PER_PAGE = 50;
const CACHE_TTL = 60; // 1 minute

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || MESSAGES_PER_PAGE;
    const skip = (page - 1) * limit;

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new AppError(400, 'Invalid conversation ID');
    }

    // Get messages with pagination
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // Get total count for pagination
    const total = await Message.countDocuments({ conversationId });

    res.status(200).json({
      status: 'success',
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { conversationId, content, type = 'text' } = req.body;
    const senderId = req.user._id;

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new AppError(400, 'Invalid conversation ID');
    }

    // Create message
    const message = new Message({
      conversationId,
      senderId,
      content,
      type,
      status: 'sent'
    });

    await message.save({ session });

    // Update conversation last message
    await mongoose.model('Conversation').findByIdAndUpdate(
      conversationId,
      {
        lastMessage: message._id,
        updatedAt: new Date()
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Emit message to conversation room
    socketService.emitToRoom(conversationId, 'new_message', message);

    res.status(201).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const updateMessageStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!['sent', 'delivered', 'read'].includes(status)) {
      throw new AppError(400, 'Invalid message status');
    }

    const message = await Message.findByIdAndUpdate(
      messageId,
      { status },
      { new: true }
    );

    if (!message) {
      throw new AppError(404, 'Message not found');
    }

    // Emit status update to conversation room
    socketService.emitToRoom(
      message.conversationId.toString(),
      'message_status_update',
      { messageId, status }
    );

    res.status(200).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      senderId: userId
    });

    if (!message) {
      throw new AppError(404, 'Message not found or unauthorized');
    }

    await message.deleteOne({ session });

    // Update conversation if this was the last message
    const lastMessage = await Message.findOne({ conversationId: message.conversationId })
      .sort({ createdAt: -1 })
      .select('_id');

    await mongoose.model('Conversation').findByIdAndUpdate(
      message.conversationId,
      {
        lastMessage: lastMessage?._id,
        updatedAt: new Date()
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Emit message deletion to conversation room
    socketService.emitToRoom(
      message.conversationId.toString(),
      'message_deleted',
      { messageId }
    );

    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}; 