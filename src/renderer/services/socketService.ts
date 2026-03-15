import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

const SERVER_URL = 'http://localhost:3000';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface SocketCallbacks {
  onStatusChange: (status: ConnectionStatus) => void;
  onCaptionBroadcast: (data: { text: string; userId: string; userName: string; timestamp: number }) => void;
  onOperatorSwitched: (data: { newOperatorUserId: string; newOperatorName: string; oldOperatorUserId: string; oldOperatorName: string }) => void;
  onMemberJoined: (data: { userId: string; name: string; role: 'operator' | 'standby' }) => void;
  onMemberLeft: (data: { userId: string }) => void;
  onMembersList: (data: { userId: string; name: string; role: 'operator' | 'standby' }[]) => void;
  onSessionEnded: (data: { sessionId: string }) => void;
}

export function connectSocket(token: string, callbacks: SocketCallbacks): TypedSocket {
  if (socket?.connected) {
    return socket;
  }

  callbacks.onStatusChange('connecting');

  socket = io(SERVER_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  }) as TypedSocket;

  socket.on('connect', () => {
    callbacks.onStatusChange('connected');
  });

  socket.on('disconnect', () => {
    callbacks.onStatusChange('disconnected');
  });

  socket.io.on('reconnect_attempt', () => {
    callbacks.onStatusChange('reconnecting');
  });

  socket.io.on('reconnect', () => {
    callbacks.onStatusChange('connected');
  });

  // 이벤트 리스너 등록
  socket.on('caption:broadcast', callbacks.onCaptionBroadcast);
  socket.on('operator:switched', callbacks.onOperatorSwitched);
  socket.on('member:joined', callbacks.onMemberJoined);
  socket.on('member:left', callbacks.onMemberLeft);
  socket.on('members:list', callbacks.onMembersList);
  socket.on('session:ended', callbacks.onSessionEnded);

  return socket;
}

export function joinSession(sessionId: string): void {
  socket?.emit('session:join', { sessionId });
}

export function leaveSession(sessionId: string): void {
  socket?.emit('session:leave', { sessionId });
}

export function sendCaption(sessionId: string, text: string): void {
  socket?.emit('caption:send', { sessionId, text });
}

export function switchOperator(sessionId: string, operatorUserId: string): void {
  socket?.emit('operator:switch', { sessionId, operatorUserId });
}

export function requestOperator(sessionId: string): void {
  socket?.emit('operator:request', { sessionId });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): TypedSocket | null {
  return socket;
}
