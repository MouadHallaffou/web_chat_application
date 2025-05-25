chatbotApp/
│
├── docker/
│
├── docker-compose.yml
├── .env
├── .gitignore
├── README.md
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── chat/
│   │   │   ├── auth/
│   │   │   ├── call/
│   │   │   ├── user/
│   │   │   └── ...
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── store/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── api/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── utils/
│   │   ├── jobs/
│   │   ├── app.js
│   │   ├── server.js
│   │   └── peer/
│   ├── package.json
│   └── tsconfig.json
│
├── shared/
│   ├── types/
│   ├── constants/
│   └── utils/
│
├── scripts/
│
└── tests/
    ├── client/
    └── server/