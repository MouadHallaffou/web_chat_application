"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
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
exports.default = router;
// Récupérer la liste d'amis de l'utilisateur connecté
router.get('/friends', async (req, res) => {
    try {
        const userId = req.user._id;
        // Récupérer toutes les amitiés actives de l'utilisateur
        const friendships = await Friendship.find({
            $or: [
                { requesterId: userId, status: 'active' },
                { recipientId: userId, status: 'active' }
            ]
        }).populate('requesterId', 'username email avatar status lastSeen')
            .populate('recipientId', 'username email avatar status lastSeen');
        // Transformer les données pour avoir la liste d'amis
        const friends = friendships.map(friendship => {
            const friend = friendship.requesterId._id.equals(userId)
                ? friendship.recipientId
                : friendship.requesterId;
            return {
                id: friend._id,
                username: friend.username,
                email: friend.email,
                avatar: friend.avatar,
                status: friend.status,
                lastSeen: friend.lastSeen,
                friendshipId: friendship._id
            };
        });
        res.json({
            status: 'success',
            data: friends
        });
    }
    catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch friends'
        });
    }
});
// Récupérer les conversations de l'utilisateur connecté
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user._id;
        // Récupérer toutes les conversations de l'utilisateur
        const conversations = await Conversation.find({
            participants: userId,
            isActive: true
        }).populate('participants', 'username email avatar status lastSeen')
            .populate('lastMessage.senderId', 'username')
            .sort({ 'lastMessage.timestamp': -1 });
        // Transformer les données pour avoir les conversations avec les amis
        const conversationsWithFriends = conversations.map(conversation => {
            const friend = conversation.participants.find(p => !p._id.equals(userId));
            return {
                id: conversation._id,
                friend: {
                    id: friend._id,
                    username: friend.username,
                    email: friend.email,
                    avatar: friend.avatar,
                    status: friend.status,
                    lastSeen: friend.lastSeen
                },
                lastMessage: conversation.lastMessage,
                unreadCount: conversation.unreadCount.get(userId.toString()) || 0,
                updatedAt: conversation.updatedAt
            };
        });
        res.json({
            status: 'success',
            data: conversationsWithFriends
        });
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch conversations'
        });
    }
});
// Envoyer une demande d'amitié
router.post('/friends/request', async (req, res) => {
    try {
        const { recipientId } = req.body;
        const requesterId = req.user._id;
        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid recipient ID'
            });
        }
        // Vérifier si une invitation existe déjà
        const existingInvitation = await FriendInvitation.findOne({
            $or: [
                { senderId: requesterId, receiverId: recipientId, status: 'pending' },
                { senderId: recipientId, receiverId: requesterId, status: 'pending' }
            ]
        });
        if (existingInvitation) {
            return res.status(400).json({
                status: 'error',
                message: 'Friend invitation already exists'
            });
        }
        // Vérifier si l'amitié existe déjà
        const existingFriendship = await Friendship.findOne({
            $or: [
                { user1Id: requesterId, user2Id: recipientId, status: 'active' },
                { user1Id: recipientId, user2Id: requesterId, status: 'active' }
            ]
        });
        if (existingFriendship) {
            return res.status(400).json({
                status: 'error',
                message: 'You are already friends'
            });
        }
        // Créer l'invitation d'ami
        const invitation = new FriendInvitation({
            senderId: requesterId,
            receiverId: recipientId,
            status: 'pending'
        });
        await invitation.save();
        res.status(201).json({
            status: 'success',
            data: invitation
        });
    }
    catch (error) {
        console.error('Error creating friend invitation:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create friend invitation'
        });
    }
});
// Accepter/Refuser une demande d'amitié
router.put('/friends/:friendshipId/respond', async (req, res) => {
    try {
        const { friendshipId } = req.params;
        const { status } = req.body; // 'accepted' ou 'rejected'
        const userId = req.user._id;
        const friendship = await Friendship.findById(friendshipId);
        if (!friendship) {
            return res.status(404).json({
                status: 'error',
                message: 'Friendship request not found'
            });
        }
        if (!friendship.recipientId.equals(userId)) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to respond to this request'
            });
        }
        friendship.status = status;
        await friendship.save();
        res.json({
            status: 'success',
            data: friendship
        });
    }
    catch (error) {
        console.error('Error responding to friendship request:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to respond to friendship request'
        });
    }
});
// Récupérer les invitations d'amis reçues (pending)
router.get('/friend-invitations', async (req, res) => {
    try {
        const userId = req.user._id;
        const invitations = await FriendInvitation.find({ receiverId: userId, status: 'pending' })
            .populate('senderId', 'username email avatar status lastSeen');
        res.json({ status: 'success', data: invitations });
    }
    catch (error) {
        console.error('Error fetching friend invitations:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch friend invitations' });
    }
});
// Accepter/Refuser une invitation d'ami
router.put('/friend-invitations/:invitationId/respond', async (req, res) => {
    try {
        const { invitationId } = req.params;
        const { status } = req.body; // 'accepted' ou 'rejected'
        const userId = req.user._id;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status' });
        }
        const invitation = await FriendInvitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({ status: 'error', message: 'Invitation not found' });
        }
        if (!invitation.receiverId.equals(userId)) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to respond to this invitation' });
        }
        if (invitation.status !== 'pending') {
            return res.status(400).json({ status: 'error', message: 'Invitation already responded' });
        }
        if (status === 'accepted') {
            // Créer le Friendship
            const [user1Id, user2Id] = invitation.senderId < invitation.receiverId
                ? [invitation.senderId, invitation.receiverId]
                : [invitation.receiverId, invitation.senderId];
            const existingFriendship = await Friendship.findOne({ user1Id, user2Id });
            if (!existingFriendship) {
                await Friendship.create({ user1Id, user2Id, status: 'active' });
            }
            invitation.status = 'accepted';
            invitation.acceptedAt = new Date();
        }
        else if (status === 'rejected') {
            invitation.status = 'rejected';
            invitation.rejectedAt = new Date();
        }
        await invitation.save();
        res.json({ status: 'success', data: invitation });
    }
    catch (error) {
        console.error('Error responding to friend invitation:', error);
        res.status(500).json({ status: 'error', message: 'Failed to respond to friend invitation' });
    }
});
// Rechercher des utilisateurs par username (hors utilisateur courant)
router.get('/users/search', async (req, res) => {
    try {
        const { username } = req.query;
        const userId = req.user._id;
        if (!username || typeof username !== 'string' || username.length < 2) {
            return res.status(400).json({ status: 'error', message: 'Username query required (min 2 chars)' });
        }
        // Recherche insensible à la casse, exclure l'utilisateur courant
        const users = await User.find({
            username: { $regex: username, $options: 'i' },
            _id: { $ne: userId }
        }).select('username email avatar status lastSeen');
        res.json({ status: 'success', data: users.map(u => ({
                id: u._id,
                username: u.username,
                email: u.email,
                avatar: u.avatar,
                status: u.status,
                lastSeen: u.lastSeen
            })) });
    }
    catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ status: 'error', message: 'Failed to search users' });
    }
});
exports.default = router;
