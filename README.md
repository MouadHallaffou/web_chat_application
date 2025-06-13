# 🤖 Chatbot Application

## 📝 Description

Une application de chatbot moderne et interactive avec des fonctionnalités de chat en temps réel, d'authentification et d'appels vidéo. Cette application est construite avec une architecture client-serveur robuste et utilise les dernières technologies web.

## ✨ Fonctionnalités

- 💬 Chat en temps réel
- 🔐 Authentification sécurisée
- 📹 Appels vidéo
- 👤 Gestion des utilisateurs
- 🔄 État de connexion en temps réel
- 🎨 Interface utilisateur moderne et responsive

## 🛠️ Technologies

### Frontend

- React
- TypeScript
- Tailwind CSS
- Socket.io Client
- Redux Toolkit

### Backend

- Node.js
- Express
- Socket.io
- MongoDB
- WebRTC

## 🚀 Installation

### Prérequis

- Node.js (v14 ou supérieur)
- Docker et Docker Compose
- MongoDB

### Configuration

1. Clonez le repository

```bash
git clone https://github.com/MouadHallaffou/web_chat_application.git
cd chatbot
```

2. Configurez les variables d'environnement

```bash
cp .env.example .env
# Modifiez les variables dans le fichier .env selon vos besoins
```

3. Installation des dépendances

```bash
# Installation des dépendances du client
cd client
npm install

# Installation des dépendances du serveur
cd ../server
npm install
```

4. Démarrage avec Docker

```bash
docker-compose up -d
```

## 📦 Structure du Projet

```
chatbot/
│
├── .github/                    # Configuration CI/CD
│   └── workflows/
│
├── docker/                     # Configuration Docker
│   ├── client/
│   ├── server/
│   └── nginx/
│
├── docs/                       # Documentation
│   ├── api/
│   ├── architecture/
│   └── deployment/
│
├── client/                     # Application Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/            # Images, fonts, etc.
│   │   ├── components/        # Composants réutilisables
│   │   ├── features/          # Modules fonctionnels
│   │   │   ├── chat/
│   │   │   ├── auth/
│   │   │   ├── call/
│   │   │   └── user/
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # Layouts de l'application
│   │   ├── pages/             # Pages de l'application
│   │   ├── routes/            # Configuration des routes
│   │   ├── services/          # Services API
│   │   ├── store/             # État global (Redux)
│   │   ├── styles/            # Styles globaux
│   │   ├── utils/             # Utilitaires
│   │   ├── i18n/              # Internationalisation
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/                     # Application Backend
│   ├── src/
│   │   ├── api/               # Routes API
│   │   ├── config/            # Configuration
│   │   ├── controllers/       # Contrôleurs
│   │   ├── middlewares/       # Middlewares
│   │   ├── models/            # Modèles de données
│   │   ├── services/          # Services métier
│   │   ├── sockets/           # Gestion WebSocket
│   │   ├── utils/             # Utilitaires
│   │   ├── jobs/              # Tâches en arrière-plan
│   │   ├── monitoring/        # Configuration monitoring
│   │   ├── logging/           # Configuration logging
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                     # Code partagé
│   ├── types/                 # Types TypeScript
│   ├── constants/             # Constantes
│   └── utils/                 # Utilitaires communs
│
├── scripts/
│
└── tests/
    ├── client/
    └── server/
```

## 🧪 Tests

```bash
# Tests du client
cd client
npm test

# Tests du serveur
cd server
npm test
```

## 📚 Documentation

La documentation détaillée est disponible dans le dossier `docs/` :

- [Guide d'installation](docs/installation.md)
- [Guide de contribution](docs/contributing.md)
- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre [guide de contribution](docs/contributing.md) pour plus de détails.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteurs

- [Votre Nom](https://github.com/votre-username)

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue dans le repository GitHub.
