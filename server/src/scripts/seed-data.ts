import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Friendship } from '../models/friendship.model';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

const sampleUsers = [
  {
    username: 'alice',
    email: 'alice@example.com',
    password: 'password123',
    avatar: 'AJ',
    isVerified: true,
    status: 'online' as const,
    lastSeen: new Date()
  },
  {
    username: 'bob',
    email: 'bob@example.com',
    password: 'password123',
    avatar: 'BS',
    isVerified: true,
    status: 'online' as const,
    lastSeen: new Date()
  },
  {
    username: 'carol',
    email: 'carol@example.com',
    password: 'password123',
    avatar: 'CW',
    isVerified: true,
    status: 'offline' as const,
    lastSeen: new Date(Date.now() - 3600000) // 1 heure ago
  },
  {
    username: 'david',
    email: 'david@example.com',
    password: 'password123',
    avatar: 'DB',
    isVerified: true,
    status: 'online' as const,
    lastSeen: new Date()
  },
  {
    username: 'eve',
    email: 'eve@example.com',
    password: 'password123',
    avatar: 'ED',
    isVerified: true,
    status: 'away' as const,
    lastSeen: new Date(Date.now() - 1800000) // 30 minutes ago
  }
];

const sampleMessages = [
  "Salut ! Comment ça va ?",
  "Très bien, merci ! Et toi ?",
  "Super ! Tu as prévu quoi ce weekend ?",
  "Pas grand chose, peut-être qu'on pourrait se voir ?",
  "Excellente idée ! On se retrouve où ?",
  "Au café du coin ? Vers 15h ?",
  "Parfait ! À tout à l'heure !",
  "À bientôt ! 😊",
  "Comment s'est passée ta journée ?",
  "Pas mal, j'ai fini le projet sur lequel je travaillais",
  "Félicitations ! C'était difficile ?",
  "Un peu, mais le résultat en vaut la peine",
  "Tu veux qu'on fasse une pause ?",
  "Oui, bonne idée ! On va où ?",
  "Je propose le parc, il fait beau !"
];

async function seedData() {
  try {
    console.log('🌱 Début du seeding des données...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Nettoyer les collections existantes
    await User.deleteMany({});
    await Friendship.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    console.log('🧹 Collections nettoyées');

    // Créer les utilisateurs
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      createdUsers.push(user);
      console.log(`👤 Utilisateur créé: ${user.username}`);
    }

    // Créer des amitiés entre tous les utilisateurs
    for (let i = 0; i < createdUsers.length; i++) {
      for (let j = i + 1; j < createdUsers.length; j++) {
        const friendship = new Friendship({
          requesterId: createdUsers[i]._id,
          recipientId: createdUsers[j]._id,
          status: 'active',
          createdAt: new Date(Date.now() - Math.random() * 86400000) // Random date within last 24h
        });
        await friendship.save();
        console.log(`🤝 Amitié créée: ${createdUsers[i].username} ↔ ${createdUsers[j].username}`);
      }
    }

    // Créer des conversations et messages
    for (let i = 0; i < createdUsers.length; i++) {
      for (let j = i + 1; j < createdUsers.length; j++) {
        const user1 = createdUsers[i];
        const user2 = createdUsers[j];

        // Créer une conversation
        const conversation = new Conversation({
          participants: [user1._id, user2._id],
          type: 'direct',
          isActive: true,
          unreadCount: new Map()
        });
        await conversation.save();

        // Créer quelques messages pour cette conversation
        const messageCount = Math.floor(Math.random() * 10) + 5; // 5-15 messages
        const messages = [];

        for (let k = 0; k < messageCount; k++) {
          const sender = k % 2 === 0 ? user1 : user2;
          const message = new Message({
            conversationId: conversation._id,
            senderId: sender._id,
            content: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
            type: 'text',
            status: 'read',
            createdAt: new Date(Date.now() - Math.random() * 86400000) // Random date within last 24h
          });
          await message.save();
          messages.push(message);
        }

        // Mettre à jour la conversation avec le dernier message
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          conversation.lastMessage = {
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            timestamp: lastMessage.createdAt
          };
          await conversation.save();
        }

        console.log(`💬 Conversation créée: ${user1.username} ↔ ${user2.username} (${messages.length} messages)`);
      }
    }

    console.log('🎉 Seeding terminé avec succès !');
    console.log(`📊 Statistiques:`);
    console.log(`   - ${createdUsers.length} utilisateurs créés`);
    console.log(`   - ${createdUsers.length * (createdUsers.length - 1) / 2} amitiés créées`);
    console.log(`   - Conversations et messages créés`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedData();
}

export { seedData }; 