# 🧪 Guide de Test - Messages Dynamiques

## 📋 **Prérequis**

1. **MongoDB** doit être en cours d'exécution
2. **Node.js** et **npm** installés
3. **Toutes les dépendances** installées

## 🚀 **Étapes de Test**

### **1. Préparer la Base de Données**

```bash
# Dans le dossier server
cd server

# Installer les dépendances si pas déjà fait
npm install

# Créer les données de test
npm run seed
```

**Résultat attendu :**
```
🌱 Début du seeding des données...
✅ Connecté à MongoDB
🧹 Collections nettoyées
👤 Utilisateur créé: alice
👤 Utilisateur créé: bob
👤 Utilisateur créé: carol
👤 Utilisateur créé: david
👤 Utilisateur créé: eve
🤝 Amitié créée: alice ↔ bob
🤝 Amitié créée: alice ↔ carol
...
💬 Conversation créée: alice ↔ bob (12 messages)
💬 Conversation créée: alice ↔ carol (8 messages)
...
🎉 Seeding terminé avec succès !
```

### **2. Démarrer le Serveur**

```bash
# Dans le dossier server
npm run dev
```

**Résultat attendu :**
```
Server is running on port 5000
Health check available at: http://localhost:5000/api/health
WebSocket server initialized
```

### **3. Démarrer le Client**

```bash
# Dans le dossier client
cd client
npm run dev
```

**Résultat attendu :**
```
Local:   http://localhost:8080/
```

### **4. Tester l'Application**

#### **A. Connexion**
1. Allez sur `http://localhost:8080/login`
2. Connectez-vous avec :
   - **Email :** `alice@example.com`
   - **Mot de passe :** `password123`

#### **B. Test de la Page de Test**
1. Allez sur `http://localhost:8080/test`
2. Vérifiez que :
   - ✅ **API Status :** Connected
   - ✅ **WebSocket Status :** Connected
   - ✅ **Utilisateur :** alice
   - ✅ **Messages en Store :** 0 (initialement)

#### **C. Test des Messages**
1. Dans la page de test, cliquez sur **"Envoyer Message de Test"**
2. Vérifiez que :
   - ✅ Le message apparaît dans la liste
   - ✅ Le compteur de messages augmente
   - ✅ Le message est envoyé via WebSocket

#### **D. Test du Chat**
1. Allez sur `http://localhost:8080/chat`
2. Vérifiez que :
   - ✅ **Liste d'amis dynamique** (alice, bob, carol, david, eve)
   - ✅ **Statuts en ligne** (indicateurs verts)
   - ✅ **Messages existants** dans les conversations
   - ✅ **Envoi de nouveaux messages** fonctionne

## 🔍 **Points de Vérification**

### **✅ Fonctionnalités à Tester**

1. **Authentification**
   - [ ] Connexion avec alice@example.com
   - [ ] Token stocké dans localStorage
   - [ ] Redirection vers le chat après connexion

2. **Liste d'Amis**
   - [ ] Chargement automatique des amis
   - [ ] Affichage des statuts (online/offline/away)
   - [ ] Indicateurs visuels de statut

3. **Messages**
   - [ ] Chargement des messages existants
   - [ ] Envoi de nouveaux messages
   - [ ] Messages temps réel via WebSocket
   - [ ] Scroll automatique vers le bas

4. **WebSocket**
   - [ ] Connexion automatique
   - [ ] Émission d'événements
   - [ ] Réception de messages en temps réel

### **🐛 Problèmes Courants**

#### **Erreur : "Cannot find module 'socket.io'"**
```bash
# Solution : Installer socket.io
cd server
npm install socket.io @types/socket.io
```

#### **Erreur : "Router.use() requires a middleware function"**
- Vérifiez que le middleware `authenticate` est bien exporté
- Vérifiez l'import dans `message.routes.ts`

#### **Erreur : "Failed to fetch friends"**
- Vérifiez que le serveur est démarré
- Vérifiez que MongoDB est connecté
- Vérifiez que les données de test sont créées

#### **WebSocket ne se connecte pas**
- Vérifiez que le serveur WebSocket est initialisé
- Vérifiez que le token d'authentification est valide
- Vérifiez les logs du serveur pour les erreurs

## 📊 **Données de Test Créées**

### **Utilisateurs**
- **alice** (alice@example.com) - password123
- **bob** (bob@example.com) - password123
- **carol** (carol@example.com) - password123
- **david** (david@example.com) - password123
- **eve** (eve@example.com) - password123

### **Amitiés**
- Tous les utilisateurs sont amis entre eux
- Statuts : active

### **Conversations**
- Une conversation entre chaque paire d'utilisateurs
- 5-15 messages par conversation
- Messages avec timestamps aléatoires

## 🎯 **Test de Performance**

### **Chargement**
- Temps de chargement de la liste d'amis : < 2s
- Temps de chargement des messages : < 1s
- Connexion WebSocket : < 1s

### **Temps Réel**
- Latence d'envoi de message : < 100ms
- Réception de message : < 200ms
- Mise à jour de statut : < 500ms

## 🔧 **Debug**

### **Logs Serveur**
```bash
# Surveiller les logs du serveur
cd server
npm run dev
```

### **Logs Client**
- Ouvrir les DevTools (F12)
- Aller dans l'onglet Console
- Vérifier les logs de connexion WebSocket

### **Base de Données**
```bash
# Se connecter à MongoDB
mongosh
use chatbot
db.users.find()
db.friendships.find()
db.conversations.find()
db.messages.find()
```

## ✅ **Validation Finale**

Si tous les tests passent, votre système de messages dynamiques est **entièrement fonctionnel** ! 🎉

### **Fonctionnalités Validées**
- ✅ Messages temps réel
- ✅ Liste d'amis dynamique
- ✅ Authentification
- ✅ WebSocket
- ✅ API REST
- ✅ Store Zustand
- ✅ Interface utilisateur responsive 