import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  sendFile,
  markAsRead,
  deleteMessage,
  editMessage
} from '../controllers/chat.controller';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes des conversations
router.get('/conversations', getConversations);
router.get('/conversations/:friendId', getOrCreateConversation);

// Routes des messages
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.post('/conversations/:conversationId/files', sendFile);
router.patch('/conversations/:conversationId/read', markAsRead);

// Routes de gestion des messages
router.patch('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);

export default router;
