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

// 세션 나가기
sessionRouter.post('/:id/leave', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const member = await prisma.sessionMember.findUnique({
    where: { sessionId_userId: { sessionId: id, userId: req.user!.userId } },
  });

  if (!member) {
    res.status(404).json({ error: '세션 멤버가 아닙니다' });
    return;
  }

  if (member.leftAt) {
    res.json({ message: '이미 나간 세션입니다' });
    return;
  }

  const updated = await prisma.sessionMember.update({
    where: { id: member.id },
    data: { leftAt: new Date() },
  });

  res.json(updated);
});

// 자막 로그 저장
sessionRouter.post('/:id/captions', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400).json({ error: '자막 텍스트를 입력해주세요' });
    return;
  }

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session || session.status !== 'active') {
    res.status(404).json({ error: '활성 세션을 찾을 수 없습니다' });
    return;
  }

  const log = await prisma.captionLog.create({
    data: {
      sessionId: id,
      userId: req.user!.userId,
      text: text.trim(),
    },
  });

  res.status(201).json(log);
});

// 자막 이력 조회
sessionRouter.get('/:id/captions', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const captions = await prisma.captionLog.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: 'asc' },
  });

  res.json(captions);
});

// 세션 내보내기
sessionRouter.get('/:id/export', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const format = (req.query.format as string) || 'json';

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
      captions: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!session) {
    res.status(404).json({ error: '세션을 찾을 수 없습니다' });
    return;
  }

  if (format === 'txt') {
    const lines: string[] = [
      `세션: ${session.name}`,
      `생성자: ${session.creator.name}`,
      `시작: ${session.createdAt.toISOString()}`,
      session.endedAt ? `종료: ${session.endedAt.toISOString()}` : '상태: 진행 중',
      `참가자: ${session.members.map((m) => m.user.name).join(', ')}`,
      '',
      '--- 자막 로그 ---',
      '',
      ...session.captions.map(
        (c) => `[${c.createdAt.toISOString()}] ${c.text}`
      ),
    ];

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="session-${id}.txt"`);
    res.send(lines.join('\n'));
    return;
  }

  // JSON format
  res.json({
    session: {
      id: session.id,
      name: session.name,
      status: session.status,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
      creator: session.creator,
      members: session.members.map((m) => ({
        name: m.user.name,
        role: m.role,
        joinedAt: m.joinedAt,
        leftAt: m.leftAt,
      })),
    },
    captions: session.captions.map((c) => ({
      text: c.text,
      createdAt: c.createdAt,
    })),
    exportedAt: new Date().toISOString(),
  });
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
