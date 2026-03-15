import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { sessionRouter } from './routes/session';
import { initSocketServer } from './socket';

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

// 라우트
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/sessions', sessionRouter);

// 헬스체크
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io 초기화
initSocketServer(server);

server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
