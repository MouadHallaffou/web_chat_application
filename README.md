# 🤖 Chatbot Application

## 📋 Description

Une application de chat moderne avec authentification, appels vidéo et gestion des utilisateurs.

## 🚀 Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, Redux Toolkit
- **Backend**: Node.js, Express, TypeScript
- **Base de données**: MongoDB
- **WebSockets**: Socket.io
- **Tests**: Jest, React Testing Library
- **CI/CD**: GitHub Actions
- **Containerisation**: Docker

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
├── scripts/                    # Scripts utilitaires
│   ├── setup.sh
│   ├── deploy.sh
│   └── seed.sh
│
├── tests/                      # Tests
│   ├── client/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   └── server/
│       ├── unit/
│       ├── integration/
│       └── e2e/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🛠 Installation

1. Cloner le repository

```bash
git clone https://github.com/votre-username/chatbot.git
cd chatbot
```

2. Installer les dépendances

```bash
# Installer les dépendances du client
cd client
npm install

# Installer les dépendances du serveur
cd ../server
npm install
```

3. Configurer les variables d'environnement

```bash
cp .env.example .env
# Éditer le fichier .env avec vos configurations
```

4. Lancer l'application

```bash
# Développement
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Tests

```bash
# Tests client
cd client
npm test

# Tests serveur
cd server
npm test
```

## 📚 Documentation

La documentation détaillée est disponible dans le dossier `docs/` :

- Architecture : `docs/architecture/`
- API : `docs/api/`
- Déploiement : `docs/deployment/`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
