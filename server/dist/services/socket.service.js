"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const error_handler_1 = require("../middlewares/error-handler");
class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId
        this.userRooms = new Map(); // userId -> Set of roomIds
    }
    initialize(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL,
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000,
            transports: ['websocket', 'polling']
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        if (!this.io)
            return;
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    throw new error_handler_1.AppError(401, 'Authentication token required');
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                const user = await user_model_1.User.findById(decoded.id).select('-password');
                if (!user) {
                    throw new error_handler_1.AppError(401, 'User not found');
                }
                socket.user = user;
                next();
            }
            catch (error) {
                next(new error_handler_1.AppError(401, 'Authentication failed'));
            }
        });
    }
    setupEventHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            const userId = socket.user._id.toString();
            this.handleConnection(socket, userId);
            socket.on('disconnect', () => this.handleDisconnect(socket, userId));
            socket.on('error', (error) => this.handleError(socket, error));
            socket.on('join_room', (roomId) => this.handleJoinRoom(socket, userId, roomId));
            socket.on('leave_room', (roomId) => this.handleLeaveRoom(socket, userId, roomId));
            socket.on('ping', () => this.handlePing(socket));
        });
    }
    handleConnection(socket, userId) {
        // Store socket mapping
        this.connectedUsers.set(userId, socket.id);
        // Update user status
        user_model_1.User.findByIdAndUpdate(userId, {
            status: 'online',
            lastSeen: new Date()
        }).catch(error => {
            console.error('Failed to update user status:', error);
        });
        // Join user's personal room
        socket.join(`user:${userId}`);
        // Broadcast user's online status
        this.io?.to(`user:${userId}`).emit('user_status', {
            userId,
            status: 'online'
        });
        console.log(`User connected: ${userId}`);
    }
    handleDisconnect(socket, userId) {
        // Remove socket mapping
        this.connectedUsers.delete(userId);
        // Update user status
        user_model_1.User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: new Date()
        }).catch(error => {
            console.error('Failed to update user status:', error);
        });
        // Leave all rooms
        const rooms = this.userRooms.get(userId);
        if (rooms) {
            rooms.forEach(roomId => {
                socket.leave(roomId);
            });
            this.userRooms.delete(userId);
        }
        // Broadcast user's offline status
        this.io?.to(`user:${userId}`).emit('user_status', {
            userId,
            status: 'offline'
        });
        console.log(`User disconnected: ${userId}`);
    }
    handleError(socket, error) {
        console.error('Socket error:', error);
        socket.emit('error', { message: 'An error occurred' });
    }
    handleJoinRoom(socket, userId, roomId) {
        socket.join(roomId);
        // Track user's rooms
        if (!this.userRooms.has(userId)) {
            this.userRooms.set(userId, new Set());
        }
        this.userRooms.get(userId)?.add(roomId);
        // Notify room members
        this.io?.to(roomId).emit('user_joined', {
            userId,
            roomId
        });
        console.log(`User ${userId} joined room ${roomId}`);
    }
    handleLeaveRoom(socket, userId, roomId) {
        socket.leave(roomId);
        // Remove room from user's tracked rooms
        this.userRooms.get(userId)?.delete(roomId);
        // Notify room members
        this.io?.to(roomId).emit('user_left', {
            userId,
            roomId
        });
        console.log(`User ${userId} left room ${roomId}`);
    }
    handlePing(socket) {
        socket.emit('pong');
    }
    emitToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io?.to(socketId).emit(event, data);
        }
    }
    emitToRoom(roomId, event, data) {
        this.io?.to(roomId).emit(event, data);
    }
    broadcast(event, data) {
        this.io?.emit(event, data);
    }
}
exports.socketService = new SocketService();
