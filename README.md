# 🤖 Chatbot Application

A modern real-time chat application with video calling capabilities, built using React, Node.js, and WebRTC.

## 🚀 Features

- Real-time messaging
- Video calling functionality
- User authentication
- Modern and responsive UI
- Real-time notifications
- Message history
- User profiles

## 🛠️ Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Socket.IO client for real-time communication
- WebRTC for video calls

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB
- WebRTC signaling server

## 📦 Project Structure

```
chatbot/
│
├── docker/                  # Docker configuration files
│
├── docker-compose.yml       # Docker compose configuration
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── README.md               # Project documentation
│
├── client/                 # Frontend application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── assets/       # Images, fonts, etc.
│   │   ├── components/   # Reusable UI components
│   │   ├── features/     # Feature-based modules
│   │   │   ├── chat/    # Chat functionality
│   │   │   ├── auth/    # Authentication
│   │   │   ├── call/    # Video calling
│   │   │   ├── user/    # User management
│   │   │   └── ...
│   │   ├── hooks/       # Custom React hooks
│   │   ├── layouts/     # Page layouts
│   │   ├── pages/       # Page components
│   │   ├── routes/      # Routing configuration
│   │   ├── services/    # API services
│   │   ├── store/       # State management
│   │   ├── styles/      # Global styles
│   │   ├── utils/       # Utility functions
│   │   ├── App.tsx      # Root component
│   │   └── main.tsx     # Entry point
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/                # Backend application
│   ├── src/
│   │   ├── api/         # API routes
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── middlewares/ # Custom middlewares
│   │   ├── models/      # Database models
│   │   ├── services/    # Business logic
│   │   ├── sockets/     # Socket.IO handlers
│   │   ├── utils/       # Utility functions
│   │   ├── jobs/        # Background jobs
│   │   ├── app.js       # Express app
│   │   ├── server.js    # Server entry point
│   │   └── peer/        # WebRTC peer server
│   ├── package.json
│   └── tsconfig.json
│
├── shared/               # Shared code between client and server
│   ├── types/           # TypeScript types
│   ├── constants/       # Shared constants
│   └── utils/           # Shared utilities
│
├── scripts/             # Build and deployment scripts
│
└── tests/              # Test files
    ├── client/         # Frontend tests
    └── server/         # Backend tests
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Docker and Docker Compose
- MongoDB

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chatbot.git
cd chatbot
```

2. Install dependencies:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables:
```bash
# Copy .env.example to .env and update the values
cp .env.example .env
```

4. Start the development servers:
```bash
# Start the backend server
cd server
npm run dev

# Start the frontend development server
cd client
npm run dev
```

## 🐳 Docker Deployment

To run the application using Docker:

```bash
docker-compose up -d
```

## 🧪 Testing

```bash
# Run client tests
cd client
npm test

# Run server tests
cd server
npm test
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - email@example.com

Project Link: [https://github.com/yourusername/chatbot](https://github.com/yourusername/chatbot)