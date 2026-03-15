import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { sessionRouter } from './routes/session';
import { initSocketServer } from './socket';
import { requestLogger } from './middleware/logger';
import { AppError } from './utils/errors';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);

// 라우트
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/sessions', sessionRouter);

// 헬스체크
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler (after all routes)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    console.error(`[Server] ${err.code}: ${err.message}`);
    res.status(err.statusCode).json({ error: err.message, code: err.code });
  } else {
    console.error('[Server] Unhandled error:', err.message);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다' });
  }
});

// Socket.io 초기화
initSocketServer(server);

server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
