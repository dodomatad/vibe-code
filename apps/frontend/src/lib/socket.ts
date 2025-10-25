import { io, Socket } from 'socket.io-client';
import { SocketEvent } from '@quizflow/shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to socket server');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from socket server');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: SocketEvent, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event: SocketEvent, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: SocketEvent, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
