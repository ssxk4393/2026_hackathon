import { Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth';

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    next(new Error('인증이 필요합니다'));
    return;
  }

  try {
    const payload = verifyToken(token);
    socket.data.user = payload;
    next();
  } catch {
    next(new Error('유효하지 않은 토큰입니다'));
  }
}
