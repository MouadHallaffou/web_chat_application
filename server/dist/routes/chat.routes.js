"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const chat_controller_1 = require("../controllers/chat.controller");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_1.authenticate);
// Routes des conversations
router.get('/conversations', chat_controller_1.getConversations);
router.get('/conversations/:friendId', chat_controller_1.getOrCreateConversation);
// Routes des messages
router.get('/conversations/:conversationId/messages', chat_controller_1.getMessages);
router.post('/conversations/:conversationId/messages', chat_controller_1.sendMessage);
router.post('/conversations/:conversationId/files', chat_controller_1.sendFile);
router.patch('/conversations/:conversationId/read', chat_controller_1.markAsRead);
// Routes de gestion des messages
router.patch('/messages/:messageId', chat_controller_1.editMessage);
router.delete('/messages/:messageId', chat_controller_1.deleteMessage);
exports.default = router;
