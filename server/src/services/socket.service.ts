import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AppError } from '../middlewares/error-handler';

interface AuthenticatedSocket extends Socket {
  user?: any;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of roomIds

  public initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
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

  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new AppError(401, 'Authentication token required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          throw new AppError(401, 'User not found');
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new AppError(401, 'Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.user._id.toString();
      this.handleConnection(socket, userId);

      socket.on('disconnect', () => this.handleDisconnect(socket, userId));
      socket.on('error', (error) => this.handleError(socket, error));
      socket.on('join_room', (roomId) => this.handleJoinRoom(socket, userId, roomId));
      socket.on('leave_room', (roomId) => this.handleLeaveRoom(socket, userId, roomId));
      socket.on('ping', () => this.handlePing(socket));
    });
  }

  private handleConnection(socket: AuthenticatedSocket, userId: string): void {
    // Store socket mapping
    this.connectedUsers.set(userId, socket.id);

    // Update user status
    User.findByIdAndUpdate(userId, {
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

  private handleDisconnect(socket: AuthenticatedSocket, userId: string): void {
    // Remove socket mapping
    this.connectedUsers.delete(userId);

    // Update user status
    User.findByIdAndUpdate(userId, {
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

  private handleError(socket: AuthenticatedSocket, error: Error): void {
    console.error('Socket error:', error);
    socket.emit('error', { message: 'An error occurred' });
  }

  private handleJoinRoom(socket: AuthenticatedSocket, userId: string, roomId: string): void {
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

  private handleLeaveRoom(socket: AuthenticatedSocket, userId: string, roomId: string): void {
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

  private handlePing(socket: AuthenticatedSocket): void {
    socket.emit('pong');
  }

  public emitToUser(userId: string, event: string, data: any): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io?.to(socketId).emit(event, data);
    }
  }

  public emitToRoom(roomId: string, event: string, data: any): void {
    this.io?.to(roomId).emit(event, data);
  }

  public broadcast(event: string, data: any): void {
    this.io?.emit(event, data);
  }
}

export const socketService = new SocketService(); 