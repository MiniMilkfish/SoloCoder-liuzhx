import { io, Socket } from 'socket.io-client';
import type { GameRoom, Player, CellState, GameMode } from '@/types';

export type SocketCallback<T = unknown> = (response: {
  success: boolean;
  error?: string;
  [key: string]: T;
}) => void;

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<(data: unknown) => void>> = new Map();

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.connected) {
        resolve(this.socket);
        return;
      }

      this.socket = io({
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server:', this.socket?.id);
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
      });

      this.socket.on('reconnect_attempt', () => {
        console.log('Attempting to reconnect...');
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  on<T = unknown>(event: string, handler: (data: T) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as (data: unknown) => void);

    this.socket?.on(event, handler);

    return () => {
      this.off(event, handler);
    };
  }

  off<T = unknown>(event: string, handler: (data: T) => void) {
    this.socket?.off(event, handler);
    this.eventHandlers.get(event)?.delete(handler as (data: unknown) => void);
  }

  emit(event: string, data?: unknown, callback?: SocketCallback) {
    if (callback) {
      this.socket?.emit(event, data, callback);
    } else {
      this.socket?.emit(event, data);
    }
  }

  createRoom(nickname: string, mode: GameMode): Promise<{
    success: boolean;
    error?: string;
    roomId?: string;
    roomState?: GameRoom;
    player?: Player;
  }> {
    return new Promise((resolve) => {
      this.emit('createRoom', { nickname, mode }, (response) => {
        resolve(response);
      });
    });
  }

  joinRoom(nickname: string, roomId: string, role: 'player' | 'spectator' = 'player'): Promise<{
    success: boolean;
    error?: string;
    roomState?: GameRoom;
    player?: Player;
    actualRole?: 'player' | 'spectator';
  }> {
    return new Promise((resolve) => {
      this.emit('joinRoom', { nickname, roomId, role }, (response) => {
        resolve(response);
      });
    });
  }

  playerReady(roomId: string): Promise<{
    success: boolean;
    error?: string;
    roomState?: GameRoom;
  }> {
    return new Promise((resolve) => {
      this.emit('playerReady', { roomId }, (response) => {
        resolve(response);
      });
    });
  }

  startGame(roomId: string): Promise<{
    success: boolean;
    error?: string;
    roomState?: GameRoom;
  }> {
    return new Promise((resolve) => {
      this.emit('startGame', { roomId }, (response) => {
        resolve(response);
      });
    });
  }

  clickCell(roomId: string, row: number, col: number): Promise<{
    success: boolean;
    error?: string;
    revealed?: CellState[];
    gameEnded?: boolean;
    winner?: string;
    winnerNickname?: string;
    reason?: string;
    nextPlayerId?: string;
    roomState?: GameRoom;
  }> {
    return new Promise((resolve) => {
      this.emit('clickCell', { roomId, row, col }, (response) => {
        resolve(response);
      });
    });
  }

  flagCell(roomId: string, row: number, col: number): Promise<{
    success: boolean;
    error?: string;
    row?: number;
    col?: number;
    flagged?: boolean;
    roomState?: GameRoom;
  }> {
    return new Promise((resolve) => {
      this.emit('flagCell', { roomId, row, col }, (response) => {
        resolve(response);
      });
    });
  }

  changeMode(roomId: string, newMode: GameMode): Promise<{
    success: boolean;
    error?: string;
    roomState?: GameRoom;
  }> {
    return new Promise((resolve) => {
      this.emit('changeMode', { roomId, newMode }, (response) => {
        resolve(response);
      });
    });
  }

  initiateResetVote(roomId: string): Promise<{
    success: boolean;
    error?: string;
    roomState?: GameRoom;
  }> {
    return new Promise((resolve) => {
      this.emit('initiateResetVote', { roomId }, (response) => {
        resolve(response);
      });
    });
  }

  voteReset(roomId: string, agree: boolean): Promise<{
    success: boolean;
    error?: string;
    reset?: boolean;
    agreedCount?: number;
    totalPlayers?: number;
    reason?: string;
    roomState?: GameRoom;
  }> {
    return new Promise((resolve) => {
      this.emit('voteReset', { roomId, agree }, (response) => {
        resolve(response);
      });
    });
  }

  reconnect(oldSocketId: string, roomId: string, nickname: string): Promise<{
    success: boolean;
    error?: string;
    player?: Player;
    roomState?: GameRoom;
    isPlayer?: boolean;
  }> {
    return new Promise((resolve) => {
      this.emit('reconnect', { oldSocketId, roomId, nickname }, (response) => {
        resolve(response);
      });
    });
  }

  getRoomState(roomId: string): Promise<{
    success: boolean;
    error?: string;
    roomState?: GameRoom;
  }> {
    return new Promise((resolve) => {
      this.emit('getRoomState', { roomId }, (response) => {
        resolve(response);
      });
    });
  }

  sendChat(roomId: string, message: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    return new Promise((resolve) => {
      this.emit('sendChat', { roomId, message }, (response) => {
        resolve(response);
      });
    });
  }
}

export const socketService = new SocketService();
export default socketService;
