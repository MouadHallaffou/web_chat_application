import express from 'express';
import { 
  getMessages, 
  sendMessage, 
  updateMessageStatus, 
  deleteMessage 
} from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Récupérer les messages d'une conversation
router.get('/conversations/:conversationId/messages', getMessages);

// Envoyer un nouveau message
router.post('/messages', sendMessage);

// Mettre à jour le statut d'un message
router.put('/messages/:messageId/status', updateMessageStatus);

// Supprimer un message
router.delete('/messages/:messageId', deleteMessage);

export default router; 