"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSchemas = initSchemas;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
// Load environment variables
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, '../../.env') });
// Import all models to ensure they are registered
const user_model_1 = require("../models/user.model");
const message_model_1 = require("../models/message.model");
const conversation_model_1 = require("../models/conversation.model");
const friendship_model_1 = require("../models/friendship.model");
const notification_model_1 = require("../models/notification.model");
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
async function initSchemas() {
    try {
        console.log('🔧 Initialisation des schémas...');
        // Connexion à MongoDB
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');
        // Récupérer la base de données
        const db = mongoose_1.default.connection.db;
        // Lister toutes les collections existantes
        const collections = await db.listCollections().toArray();
        console.log('📋 Collections existantes :');
        collections.forEach(collection => {
            console.log(`   - ${collection.name}`);
        });
        // Vérifier que les collections des modèles existent
        const modelCollections = [
            'users',
            'messages',
            'conversations',
            'friendships',
            'friendinvitations',
            'notifications'
        ];
        console.log('\n🔍 Vérification des collections de modèles :');
        for (const collectionName of modelCollections) {
            const exists = collections.some(col => col.name === collectionName);
            console.log(`   ${exists ? '✅' : '❌'} ${collectionName}`);
            if (!exists) {
                console.log(`   ⚠️  La collection ${collectionName} sera créée automatiquement lors de la première insertion`);
            }
        }
        // Créer des index pour optimiser les performances
        console.log('\n📊 Création des index...');
        // Index pour User
        await user_model_1.User.collection.createIndex({ email: 1 }, { unique: true });
        await user_model_1.User.collection.createIndex({ username: 1 }, { unique: true });
        console.log('   ✅ Index User créés');
        // Index pour Message
        await message_model_1.Message.collection.createIndex({ conversationId: 1, createdAt: -1 });
        await message_model_1.Message.collection.createIndex({ senderId: 1 });
        console.log('   ✅ Index Message créés');
        // Index pour Conversation
        await conversation_model_1.Conversation.collection.createIndex({ participants: 1 });
        await conversation_model_1.Conversation.collection.createIndex({ 'lastMessage.timestamp': -1 });
        console.log('   ✅ Index Conversation créés');
        // Index pour Friendship
        await friendship_model_1.Friendship.collection.createIndex({ requesterId: 1, recipientId: 1 }, { unique: true });
        await friendship_model_1.Friendship.collection.createIndex({ status: 1 });
        console.log('   ✅ Index Friendship créés');
        // Index pour Notification
        await notification_model_1.Notification.collection.createIndex({ recipientId: 1, read: 1 });
        await notification_model_1.Notification.collection.createIndex({ createdAt: -1 });
        console.log('   ✅ Index Notification créés');
        console.log('\n🎉 Initialisation des schémas terminée !');
        console.log('💡 Les collections seront créées automatiquement lors de la première utilisation');
    }
    catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des schémas:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}
// Exécuter le script si appelé directement
if (require.main === module) {
    initSchemas();
}
