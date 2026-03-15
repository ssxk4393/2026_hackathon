import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware } from './auth';
import { registerHandlers } from './handlers';

let io: Server;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174'],
      credentials: true,
    },
  });

  // JWT 인증 미들웨어
  io.use(socketAuthMiddleware);

  // 연결 이벤트
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.data.user.name} (${socket.id})`);
    registerHandlers(io, socket);
  });

  console.log('[Socket] WebSocket server initialized');
  return io;
}

export function getIO(): Server {
  return io;
}
