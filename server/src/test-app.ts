import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { sessionRouter } from './routes/session';

/**
 * Creates a fresh express app for testing purposes.
 * Does not listen on a port or initialize Socket.io.
 */
export function createTestApp(): express.Express {
  const app = express();

  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }));
  app.use(express.json());

  app.use('/auth', authRouter);
  app.use('/users', userRouter);
  app.use('/sessions', sessionRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}
