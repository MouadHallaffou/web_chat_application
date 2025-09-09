"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Inline data routes removed; using controller-driven routes only
const auth_1 = require("../middlewares/auth");
const friendship_controller_1 = require("../controllers/friendship.controller");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_1.authenticate);
// Routes pour la recherche d'utilisateurs
router.get('/search', friendship_controller_1.searchUsers);
// Routes pour les invitations
router.post('/invitations', friendship_controller_1.sendFriendInvitation);
router.get('/invitations/received', friendship_controller_1.getReceivedInvitations);
router.get('/invitations/sent', friendship_controller_1.getSentInvitations);
router.patch('/invitations/:invitationId/respond', friendship_controller_1.respondToInvitation);
router.delete('/invitations/:invitationId', friendship_controller_1.cancelInvitation);
// Routes pour les amis
router.get('/friends', friendship_controller_1.getFriends);
router.delete('/friends/:friendId', friendship_controller_1.removeFriend);
// Keep default export only once at the bottom
exports.default = router;
