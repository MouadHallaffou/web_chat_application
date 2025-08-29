"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const message_controller_1 = require("../controllers/message.controller");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
// Toutes les routes nécessitent une authentification
router.use(auth_1.authenticate);
// Récupérer les messages d'une conversation
router.get('/conversations/:conversationId/messages', message_controller_1.getMessages);
// Envoyer un nouveau message
router.post('/messages', message_controller_1.sendMessage);
// Mettre à jour le statut d'un message
router.put('/messages/:messageId/status', message_controller_1.updateMessageStatus);
// Supprimer un message
router.delete('/messages/:messageId', message_controller_1.deleteMessage);
exports.default = router;
