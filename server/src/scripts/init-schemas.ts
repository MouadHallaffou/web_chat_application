import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../../.env') });

// Import all models to ensure they are registered
import { User } from '../models/user.model';
import { Message } from '../models/message.model';
import { Conversation } from '../models/conversation.model';
import { Friendship } from '../models/friendship.model';
import { FriendInvitation } from '../models/friend-invitation.model';
import { Notification } from '../models/notification.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

async function initSchemas() {
  try {
    console.log('🔧 Initialisation des schémas...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Récupérer la base de données
    const db = mongoose.connection.db;
    
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
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    console.log('   ✅ Index User créés');
    
    // Index pour Message
    await Message.collection.createIndex({ conversationId: 1, createdAt: -1 });
    await Message.collection.createIndex({ senderId: 1 });
    console.log('   ✅ Index Message créés');
    
    // Index pour Conversation
    await Conversation.collection.createIndex({ participants: 1 });
    await Conversation.collection.createIndex({ 'lastMessage.timestamp': -1 });
    console.log('   ✅ Index Conversation créés');
    
    // Index pour Friendship
    await Friendship.collection.createIndex({ requesterId: 1, recipientId: 1 }, { unique: true });
    await Friendship.collection.createIndex({ status: 1 });
    console.log('   ✅ Index Friendship créés');
    
    // Index pour Notification
    await Notification.collection.createIndex({ recipientId: 1, read: 1 });
    await Notification.collection.createIndex({ createdAt: -1 });
    console.log('   ✅ Index Notification créés');
    
    console.log('\n🎉 Initialisation des schémas terminée !');
    console.log('💡 Les collections seront créées automatiquement lors de la première utilisation');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des schémas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initSchemas();
}

export { initSchemas }; 