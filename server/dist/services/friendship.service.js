"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendshipService = void 0;
const models_1 = require("../models");
class FriendshipService {
    // Rechercher des utilisateurs par nom d'utilisateur
    static async searchUsers(query, currentUserId, limit = 10) {
        const users = await models_1.User.find({
            $and: [
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ]
                },
                { _id: { $ne: currentUserId } } // Exclure l'utilisateur actuel
            ]
        })
            .select('username email avatar status lastSeen')
            .limit(limit);
        // Vérifier le statut d'amitié pour chaque utilisateur
        const usersWithStatus = await Promise.all(users.map(async (user) => {
            const friendship = await models_1.Friendship.findFriendship(currentUserId, user._id);
            const invitation = await models_1.FriendInvitation.findOne({
                $or: [
                    { senderId: currentUserId, receiverId: user._id },
                    { senderId: user._id, receiverId: currentUserId }
                ]
            });
            return {
                ...user.toObject(),
                friendshipStatus: friendship ? friendship.status : null,
                invitationStatus: invitation ? invitation.status : null
            };
        }));
        return usersWithStatus;
    }
    // Envoyer une invitation d'amis
    static async sendFriendInvitation(senderId, receiverId, message) {
        // Vérifier si les utilisateurs existent
        const [sender, receiver] = await Promise.all([
            models_1.User.findById(senderId),
            models_1.User.findById(receiverId)
        ]);
        if (!sender || !receiver) {
            throw new Error('Utilisateur non trouvé');
        }
        // Vérifier si une amitié existe déjà
        const existingFriendship = await models_1.Friendship.findFriendship(senderId, receiverId);
        if (existingFriendship) {
            throw new Error('Vous êtes déjà amis avec cet utilisateur');
        }
        // Vérifier si une invitation existe déjà
        const existingInvitation = await models_1.FriendInvitation.findOne({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        });
        if (existingInvitation) {
            throw new Error('Une invitation existe déjà entre ces utilisateurs');
        }
        // Créer l'invitation
        const invitation = new models_1.FriendInvitation({
            senderId,
            receiverId,
            message
        });
        await invitation.save();
        // Créer une notification
        await models_1.Notification.createNotification({
            recipientId: receiverId,
            senderId,
            type: 'friend_request',
            title: 'Nouvelle demande d\'ami',
            message: `${sender.username} vous a envoyé une demande d'ami`,
            data: { invitationId: invitation._id }
        });
        return invitation;
    }
    // Accepter une invitation d'amis
    static async acceptFriendInvitation(invitationId, userId) {
        const invitation = await models_1.FriendInvitation.findById(invitationId);
        if (!invitation) {
            throw new Error('Invitation non trouvée');
        }
        if (invitation.receiverId.toString() !== userId.toString()) {
            throw new Error('Vous n\'êtes pas autorisé à accepter cette invitation');
        }
        if (invitation.status !== 'pending') {
            throw new Error('Cette invitation n\'est plus valide');
        }
        // Mettre à jour l'invitation
        invitation.status = 'accepted';
        invitation.acceptedAt = new Date();
        await invitation.save();
        // Créer la relation d'amis
        const friendship = new models_1.Friendship({
            user1Id: invitation.senderId,
            user2Id: invitation.receiverId,
            status: 'active'
        });
        await friendship.save();
        // Créer une notification pour l'expéditeur
        await models_1.Notification.createNotification({
            recipientId: invitation.senderId,
            senderId: invitation.receiverId,
            type: 'friend_accepted',
            title: 'Demande d\'ami acceptée',
            message: `${invitation.receiverId} a accepté votre demande d'ami`,
            data: { invitationId: invitation._id }
        });
        return { invitation, friendship };
    }
    // Rejeter une invitation d'amis
    static async rejectFriendInvitation(invitationId, userId) {
        const invitation = await models_1.FriendInvitation.findById(invitationId);
        if (!invitation) {
            throw new Error('Invitation non trouvée');
        }
        if (invitation.receiverId.toString() !== userId.toString()) {
            throw new Error('Vous n\'êtes pas autorisé à rejeter cette invitation');
        }
        invitation.status = 'rejected';
        invitation.rejectedAt = new Date();
        await invitation.save();
        return invitation;
    }
    // Annuler une invitation d'amis
    static async cancelFriendInvitation(invitationId, userId) {
        const invitation = await models_1.FriendInvitation.findById(invitationId);
        if (!invitation) {
            throw new Error('Invitation non trouvée');
        }
        if (invitation.senderId.toString() !== userId.toString()) {
            throw new Error('Vous n\'êtes pas autorisé à annuler cette invitation');
        }
        invitation.status = 'cancelled';
        await invitation.save();
        return invitation;
    }
    // Obtenir la liste des amis d'un utilisateur
    static async getUserFriends(userId) {
        const friendships = await models_1.Friendship.getUserFriends(userId);
        return friendships.map((friendship) => {
            const friend = friendship.user1Id.toString() === userId.toString()
                ? friendship.user2Id
                : friendship.user1Id;
            return {
                ...(friend.toObject ? friend.toObject() : friend),
                friendshipId: friendship._id,
                lastInteractionAt: friendship.lastInteractionAt
            };
        });
    }
    // Obtenir les invitations envoyées par un utilisateur
    static async getSentInvitations(userId) {
        return models_1.FriendInvitation.find({
            senderId: userId,
            status: 'pending'
        }).populate('receiverId', 'username email avatar');
    }
    // Obtenir les invitations reçues par un utilisateur
    static async getReceivedInvitations(userId) {
        return models_1.FriendInvitation.find({
            receiverId: userId,
            status: 'pending'
        }).populate('senderId', 'username email avatar');
    }
    // Supprimer un ami
    static async removeFriend(userId, friendId) {
        const friendship = await models_1.Friendship.findFriendship(userId, friendId);
        if (!friendship) {
            throw new Error('Relation d\'amitié non trouvée');
        }
        await friendship.deleteOne();
        return { success: true };
    }
    // Bloquer un utilisateur
    static async blockUser(userId, userToBlockId) {
        let friendship = await models_1.Friendship.findFriendship(userId, userToBlockId);
        if (!friendship) {
            // Créer une relation bloquée
            friendship = new models_1.Friendship({
                user1Id: userId,
                user2Id: userToBlockId,
                status: 'blocked',
                blockedBy: userId
            });
        }
        else {
            friendship.status = 'blocked';
            friendship.blockedBy = userId;
        }
        await friendship.save();
        return friendship;
    }
    // Débloquer un utilisateur
    static async unblockUser(userId, userToUnblockId) {
        const friendship = await models_1.Friendship.findFriendship(userId, userToUnblockId);
        if (!friendship || friendship.status !== 'blocked') {
            throw new Error('Utilisateur non bloqué');
        }
        if (friendship.blockedBy?.toString() !== userId.toString()) {
            throw new Error('Vous n\'avez pas bloqué cet utilisateur');
        }
        await friendship.deleteOne();
        return { success: true };
    }
}
exports.FriendshipService = FriendshipService;
