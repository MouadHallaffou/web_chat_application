import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketConfig {
  url: string;
  token: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor() {
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleReconnect = this.handleReconnect.bind(this);
  }

  public connect(config: SocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(config.url, {
          auth: {
            token: config.token
          },
          reconnection: true,
          reconnectionAttempts: config.reconnectAttempts || this.reconnectAttempts,
          reconnectionDelay: config.reconnectDelay || this.reconnectDelay,
          timeout: 10000,
          transports: ['websocket', 'polling']
        });

        this.setupEventListeners();
        this.startHeartbeat();

        this.socket.on('connect', () => {
          this.isConnected = true;
          console.log('Socket connected successfully');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        reject(error);
      }
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', this.handleDisconnect);
    this.socket.on('error', this.handleError);
    this.socket.on('reconnect', this.handleReconnect);
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Attempting to reconnect (${attemptNumber}/${this.reconnectAttempts})`);
    });
    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });
    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after all attempts');
      toast.error('Connection lost. Please refresh the page.');
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private handleDisconnect(reason: string): void {
    this.isConnected = false;
    console.log('Socket disconnected:', reason);

    if (reason === 'io server disconnect') {
      // Server initiated disconnect, try to reconnect
      this.socket?.connect();
    }
  }

  private handleError(error: Error): void {
    console.error('Socket error:', error);
    toast.error('Connection error. Please try again.');
  }

  private handleReconnect(attemptNumber: number): void {
    console.log(`Reconnected after ${attemptNumber} attempts`);
    this.isConnected = true;
    toast.success('Connection restored');
  }

  public disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
  }

  public emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  public on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  public off(event: string, callback?: (data: any) => void): void {
    this.socket?.off(event, callback);
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const socketService = new SocketService(); 