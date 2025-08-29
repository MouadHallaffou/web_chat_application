"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFriend = exports.getFriends = exports.cancelInvitation = exports.respondToInvitation = exports.getSentInvitations = exports.getReceivedInvitations = exports.sendFriendInvitation = exports.searchUsers = void 0;
const user_model_1 = require("../models/user.model");
const friend_invitation_model_1 = require("../models/friend-invitation.model");
const friendship_model_1 = require("../models/friendship.model");
const error_handler_1 = require("../middlewares/error-handler");
const mongoose_1 = __importDefault(require("mongoose"));
// Rechercher des utilisateurs par nom d'utilisateur
const searchUsers = async (req, res, next) => {
    try {
        console.log('🔍 Search users endpoint called');
        console.log('📋 Query params:', req.query);
        console.log('👤 User:', req.user);
        const { query } = req.query;
        const userId = req.user._id;
        console.log('🔍 Search query:', query);
        console.log('👤 User ID:', userId);
        if (!query || typeof query !== 'string' || query.trim().length < 2) {
            console.log('❌ Query too short or missing');
            return res.json({
                status: 'success',
                data: []
            });
        }
        // Rechercher les utilisateurs correspondants (excluant l'utilisateur connecté)
        console.log('🔍 Searching users with query:', query.trim());
        const users = await user_model_1.User.find({
            _id: { $ne: userId },
            username: { $regex: query.trim(), $options: 'i' }
        })
            .select('username email avatar status lastSeen')
            .limit(10);
        console.log('👥 Found users:', users.length);
        console.log('👥 Users data:', users);
        // Récupérer les invitations existantes
        const existingInvitations = await friend_invitation_model_1.FriendInvitation.find({
            $or: [
                { senderId: userId, receiverId: { $in: users.map(u => u._id) } },
                { receiverId: userId, senderId: { $in: users.map(u => u._id) } }
            ]
        });
        // Récupérer les amitiés existantes
        const existingFriendships = await friendship_model_1.Friendship.find({
            $or: [
                { user1Id: userId, user2Id: { $in: users.map(u => u._id) } },
                { user2Id: userId, user1Id: { $in: users.map(u => u._id) } }
            ]
        });
        // Enrichir les résultats avec le statut de la relation
        const enrichedUsers = users.map(user => {
            const invitation = existingInvitations.find(inv => (inv.senderId.equals(userId) && inv.receiverId.equals(user._id)) ||
                (inv.receiverId.equals(userId) && inv.senderId.equals(user._id)));
            const friendship = existingFriendships.find(f => (f.user1Id.equals(userId) && f.user2Id.equals(user._id)) ||
                (f.user2Id.equals(userId) && f.user1Id.equals(user._id)));
            let relationshipStatus = 'none';
            if (friendship) {
                relationshipStatus = friendship.status; // 'active' ou 'blocked'
            }
            else if (invitation) {
                if (invitation.senderId.equals(userId)) {
                    relationshipStatus = `sent_${invitation.status}`; // sent_pending, sent_rejected, etc.
                }
                else {
                    relationshipStatus = `received_${invitation.status}`; // received_pending, etc.
                }
            }
            return {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status,
                lastSeen: user.lastSeen,
                relationshipStatus
            };
        });
        res.json({
            status: 'success',
            data: enrichedUsers
        });
    }
    catch (error) {
        next(error);
    }
};
exports.searchUsers = searchUsers;
// Envoyer une invitation d'amitié
const sendFriendInvitation = async (req, res, next) => {
    try {
        const { receiverId, message } = req.body;
        const senderId = req.user._id;
        if (!receiverId || !mongoose_1.default.isValidObjectId(receiverId)) {
            return next(new error_handler_1.AppError(400, 'ID du destinataire invalide'));
        }
        if (senderId.equals(receiverId)) {
            return next(new error_handler_1.AppError(400, 'Vous ne pouvez pas vous envoyer une invitation à vous-même'));
        }
        // Vérifier que le destinataire existe
        const receiver = await user_model_1.User.findById(receiverId);
        if (!receiver) {
            return next(new error_handler_1.AppError(404, 'Utilisateur non trouvé'));
        }
        // Vérifier s'il n'y a pas déjà une amitié
        const existingFriendship = await friendship_model_1.Friendship.findOne({
            $or: [
                { user1Id: senderId, user2Id: receiverId },
                { user2Id: senderId, user1Id: receiverId }
            ]
        });
        if (existingFriendship) {
            return next(new error_handler_1.AppError(400, 'Vous êtes déjà amis ou la relation est bloquée'));
        }
        // Vérifier s'il n'y a pas déjà une invitation en cours
        const existingInvitation = await friend_invitation_model_1.FriendInvitation.findOne({
            $or: [
                { senderId, receiverId, status: 'pending' },
                { senderId: receiverId, receiverId: senderId, status: 'pending' }
            ]
        });
        if (existingInvitation) {
            return next(new error_handler_1.AppError(400, 'Une invitation est déjà en cours'));
        }
        // Créer la nouvelle invitation
        const invitation = new friend_invitation_model_1.FriendInvitation({
            senderId,
            receiverId,
            message: message?.trim() || undefined,
            status: 'pending'
        });
        await invitation.save();
        // Peupler les données pour la réponse
        await invitation.populate('senderId', 'username avatar');
        await invitation.populate('receiverId', 'username avatar');
        // TODO: Envoyer une notification temps réel au destinataire
        // socketService.sendToUser(receiverId, 'friend_invitation', invitation);
        res.status(201).json({
            status: 'success',
            message: 'Invitation d\'amitié envoyée',
            data: invitation
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendFriendInvitation = sendFriendInvitation;
// Récupérer les invitations reçues
const getReceivedInvitations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitations = await friend_invitation_model_1.FriendInvitation.find({
            receiverId: userId,
            status: 'pending'
        })
            .populate('senderId', 'username email avatar status lastSeen')
            .sort({ createdAt: -1 });
        res.json({
            status: 'success',
            data: invitations
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReceivedInvitations = getReceivedInvitations;
// Récupérer les invitations envoyées
const getSentInvitations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const invitations = await friend_invitation_model_1.FriendInvitation.find({
            senderId: userId,
            status: 'pending'
        })
            .populate('receiverId', 'username email avatar status lastSeen')
            .sort({ createdAt: -1 });
        res.json({
            status: 'success',
            data: invitations
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSentInvitations = getSentInvitations;
// Répondre à une invitation (accepter/refuser)
const respondToInvitation = async (req, res, next) => {
    try {
        console.log('=== RESPOND TO INVITATION ===');
        console.log('Params:', req.params);
        console.log('Body:', req.body);
        console.log('User:', req.user);
        const { invitationId } = req.params;
        const { action } = req.body; // 'accept' ou 'reject'
        const userId = req.user._id;
        console.log(`Processing invitation ${invitationId} with action ${action} for user ${userId}`);
        if (!mongoose_1.default.isValidObjectId(invitationId)) {
            console.log('Invalid invitation ID');
            return next(new error_handler_1.AppError(400, 'ID d\'invitation invalide'));
        }
        if (!['accept', 'reject'].includes(action)) {
            console.log('Invalid action:', action);
            return next(new error_handler_1.AppError(400, 'Action invalide. Utilisez "accept" ou "reject"'));
        }
        const invitation = await friend_invitation_model_1.FriendInvitation.findById(invitationId);
        console.log('Found invitation:', invitation);
        if (!invitation) {
            console.log('Invitation not found');
            return next(new error_handler_1.AppError(404, 'Invitation non trouvée'));
        }
        if (!invitation.receiverId.equals(userId)) {
            console.log('User is not the receiver of this invitation');
            return next(new error_handler_1.AppError(403, 'Vous ne pouvez répondre qu\'aux invitations qui vous sont adressées'));
        }
        if (invitation.status !== 'pending') {
            console.log('Invitation already processed with status:', invitation.status);
            return next(new error_handler_1.AppError(400, 'Cette invitation a déjà été traitée'));
        }
        // Démarrer une transaction
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            if (action === 'accept') {
                // Accepter l'invitation
                invitation.status = 'accepted';
                invitation.acceptedAt = new Date();
                await invitation.save({ session });
                // Créer l'amitié
                const friendship = new friendship_model_1.Friendship({
                    user1Id: invitation.senderId,
                    user2Id: invitation.receiverId,
                    status: 'active',
                    lastInteractionAt: new Date()
                });
                await friendship.save({ session });
                await session.commitTransaction();
                // TODO: Notifier l'expéditeur
                // socketService.sendToUser(invitation.senderId, 'friend_accepted', { userId, username: req.user.username });
                res.json({
                    status: 'success',
                    message: 'Invitation acceptée',
                    data: { friendship }
                });
            }
            else {
                // Refuser l'invitation
                invitation.status = 'rejected';
                invitation.rejectedAt = new Date();
                await invitation.save({ session });
                await session.commitTransaction();
                res.json({
                    status: 'success',
                    message: 'Invitation refusée'
                });
            }
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    catch (error) {
        next(error);
    }
};
exports.respondToInvitation = respondToInvitation;
// Annuler une invitation envoyée
const cancelInvitation = async (req, res, next) => {
    try {
        const { invitationId } = req.params;
        const userId = req.user._id;
        if (!mongoose_1.default.isValidObjectId(invitationId)) {
            return next(new error_handler_1.AppError(400, 'ID d\'invitation invalide'));
        }
        const invitation = await friend_invitation_model_1.FriendInvitation.findById(invitationId);
        if (!invitation) {
            return next(new error_handler_1.AppError(404, 'Invitation non trouvée'));
        }
        if (!invitation.senderId.equals(userId)) {
            return next(new error_handler_1.AppError(403, 'Vous ne pouvez annuler que vos propres invitations'));
        }
        if (invitation.status !== 'pending') {
            return next(new error_handler_1.AppError(400, 'Cette invitation ne peut plus être annulée'));
        }
        invitation.status = 'cancelled';
        await invitation.save();
        res.json({
            status: 'success',
            message: 'Invitation annulée'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelInvitation = cancelInvitation;
// Récupérer la liste des amis
const getFriends = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const friendships = await friendship_model_1.Friendship.find({
            $or: [
                { user1Id: userId, status: 'active' },
                { user2Id: userId, status: 'active' }
            ]
        })
            .populate('user1Id', 'username email avatar status lastSeen')
            .populate('user2Id', 'username email avatar status lastSeen')
            .sort({ lastInteractionAt: -1 });
        const friends = friendships.map(friendship => {
            const friend = friendship.user1Id._id.equals(userId)
                ? friendship.user2Id
                : friendship.user1Id;
            return {
                id: friend._id,
                username: friend.username,
                email: friend.email,
                avatar: friend.avatar,
                status: friend.status,
                lastSeen: friend.lastSeen,
                friendshipId: friendship._id,
                lastInteractionAt: friendship.lastInteractionAt
            };
        });
        res.json({
            status: 'success',
            data: friends
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFriends = getFriends;
// Supprimer un ami
const removeFriend = async (req, res, next) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;
        if (!mongoose_1.default.isValidObjectId(friendId)) {
            return next(new error_handler_1.AppError(400, 'ID d\'ami invalide'));
        }
        const friendship = await friendship_model_1.Friendship.findOne({
            $or: [
                { user1Id: userId, user2Id: friendId },
                { user2Id: userId, user1Id: friendId }
            ]
        });
        if (!friendship) {
            return next(new error_handler_1.AppError(404, 'Amitié non trouvée'));
        }
        await friendship_model_1.Friendship.findByIdAndDelete(friendship._id);
        res.json({
            status: 'success',
            message: 'Ami supprimé'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeFriend = removeFriend;
