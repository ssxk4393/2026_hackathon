import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const sessionRouter = Router();

// 모든 라우트에 인증 필요
sessionRouter.use(authMiddleware);

// 세션 목록 조회
sessionRouter.get('/', async (req: AuthRequest, res: Response) => {
  const sessions = await prisma.session.findMany({
    where: { status: 'active' },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(sessions);
});

// 세션 생성
sessionRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { name, maxOperators = 2 } = req.body;

  if (!name) {
    res.status(400).json({ error: '세션 이름을 입력해주세요' });
    return;
  }

  const session = await prisma.session.create({
    data: {
      name,
      maxOperators,
      createdBy: req.user!.userId,
      members: {
        create: {
          userId: req.user!.userId,
          role: 'operator',
        },
      },
    },
    include: {
      creator: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  res.status(201).json(session);
});

// 세션 참가
sessionRouter.post('/:id/join', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!session || session.status !== 'active') {
    res.status(404).json({ error: '활성 세션을 찾을 수 없습니다' });
    return;
  }

  // 이미 참가 중인지 확인
  const existing = session.members.find((m) => m.userId === req.user!.userId);
  if (existing) {
    res.json({ message: '이미 참가 중입니다', role: existing.role });
    return;
  }

  // operator 수 확인 → 초과하면 standby
  const operatorCount = session.members.filter((m) => m.role === 'operator').length;
  const role = operatorCount < session.maxOperators ? 'operator' : 'standby';

  const member = await prisma.sessionMember.create({
    data: {
      sessionId: id,
      userId: req.user!.userId,
      role,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  res.status(201).json(member);
});

// 세션 종료
sessionRouter.post('/:id/end', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const session = await prisma.session.findUnique({ where: { id } });

  if (!session) {
    res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    return;
  }

  if (session.createdBy !== req.user!.userId) {
    res.status(403).json({ error: '세션 생성자만 종료할 수 있습니다' });
    return;
  }

  const updated = await prisma.session.update({
    where: { id },
    data: { status: 'ended', endedAt: new Date() },
  });

  res.json(updated);
});

// 세션 상세 조회
sessionRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
  });

  if (!session) {
    res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    return;
  }

  res.json(session);
});
