import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const userRouter = Router();

// 내 정보 조회
userRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, avatar: true, provider: true, createdAt: true },
  });

  if (!user) {
    res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    return;
  }

  res.json(user);
});

// 내 정보 수정
userRouter.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: '이름을 입력해주세요' });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { name },
    select: { id: true, name: true, email: true, avatar: true },
  });

  res.json(user);
});
