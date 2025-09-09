import { Router } from 'express';
// Inline data routes removed; using controller-driven routes only
import { authenticate } from '../middlewares/auth';
import {
  searchUsers,
  sendFriendInvitation,
  getReceivedInvitations,
  getSentInvitations,
  respondToInvitation,
  cancelInvitation,
  getFriends,
  removeFriend
} from '../controllers/friendship.controller';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes pour la recherche d'utilisateurs
router.get('/search', searchUsers);

// Routes pour les invitations
router.post('/invitations', sendFriendInvitation);
router.get('/invitations/received', getReceivedInvitations);
router.get('/invitations/sent', getSentInvitations);
router.patch('/invitations/:invitationId/respond', respondToInvitation);
router.delete('/invitations/:invitationId', cancelInvitation);

// Routes pour les amis
router.get('/friends', getFriends);
router.delete('/friends/:friendId', removeFriend);

// Keep default export only once at the bottom

export default router; 