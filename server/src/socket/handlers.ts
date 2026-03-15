import { Server, Socket } from 'socket.io';
import { prisma } from '../db/prisma';
import type { AuthPayload } from '../middleware/auth';

// 세션별 온라인 멤버 추적
const sessionMembers = new Map<string, Map<string, { userId: string; name: string; role: string; socketId: string }>>();

function getSessionRoom(sessionId: string): string {
  return `session:${sessionId}`;
}

async function getMemberRole(sessionId: string, userId: string): Promise<string> {
  const member = await prisma.sessionMember.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  return member?.role || 'standby';
}

function broadcastMembersList(io: Server, sessionId: string): void {
  const room = getSessionRoom(sessionId);
  const members = sessionMembers.get(sessionId);
  if (!members) return;

  const memberList = Array.from(members.values()).map(({ userId, name, role }) => ({
    userId,
    name,
    role,
  }));
  io.to(room).emit('members:list', memberList);
}

export function registerHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user as AuthPayload;

  // 세션 입장
  socket.on('session:join', async (data: { sessionId: string }) => {
    const { sessionId } = data;
    const room = getSessionRoom(sessionId);

    // 세션 유효성 확인
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.status !== 'active') {
      socket.emit('error', { message: '활성 세션을 찾을 수 없습니다' });
      return;
    }

    // room 입장
    socket.join(room);

    // 온라인 멤버 추적
    if (!sessionMembers.has(sessionId)) {
      sessionMembers.set(sessionId, new Map());
    }
    const members = sessionMembers.get(sessionId)!;
    const role = await getMemberRole(sessionId, user.userId);

    members.set(user.userId, {
      userId: user.userId,
      name: user.name,
      role,
      socketId: socket.id,
    });

    // 기존 멤버들에게 입장 알림
    socket.to(room).emit('member:joined', {
      userId: user.userId,
      name: user.name,
      role,
    });

    // 전체 멤버 목록 브로드캐스트
    broadcastMembersList(io, sessionId);

    console.log(`[Socket] ${user.name} joined session ${sessionId} as ${role}`);
  });

  // 세션 퇴장
  socket.on('session:leave', (data: { sessionId: string }) => {
    const { sessionId } = data;
    leaveSession(io, socket, sessionId, user);
  });

  // 자막 송출
  socket.on('caption:send', async (data: { sessionId: string; text: string }) => {
    const { sessionId, text } = data;
    const room = getSessionRoom(sessionId);

    // 다른 멤버들에게 자막 브로드캐스트
    socket.to(room).emit('caption:broadcast', {
      text,
      userId: user.userId,
      userName: user.name,
      timestamp: Date.now(),
    });

    // DB에 자막 로그 저장
    await prisma.captionLog.create({
      data: {
        sessionId,
        userId: user.userId,
        text,
      },
    }).catch(() => {
      // DB 저장 실패해도 브로드캐스트는 이미 완료
    });
  });

  // 송출 담당자 전환 (operator가 특정 standby에게 넘기기)
  socket.on('operator:switch', async (data: { sessionId: string; operatorUserId: string }) => {
    const { sessionId, operatorUserId } = data;
    const room = getSessionRoom(sessionId);
    const members = sessionMembers.get(sessionId);
    if (!members) return;

    const currentOp = members.get(user.userId);
    if (!currentOp || currentOp.role !== 'operator') return;

    const target = members.get(operatorUserId);
    if (!target || target.role !== 'standby') return;

    // DB에서 role 교체 (트랜잭션)
    await prisma.$transaction([
      prisma.sessionMember.updateMany({
        where: { sessionId, userId: user.userId, role: 'operator' },
        data: { role: 'standby' },
      }),
      prisma.sessionMember.updateMany({
        where: { sessionId, userId: operatorUserId, role: 'standby' },
        data: { role: 'operator' },
      }),
    ]);

    // 메모리 업데이트
    currentOp.role = 'standby';
    target.role = 'operator';

    // 전체에 교대 알림
    io.to(room).emit('operator:switched', {
      newOperatorUserId: operatorUserId,
      newOperatorName: target.name,
      oldOperatorUserId: user.userId,
      oldOperatorName: user.name,
    });

    broadcastMembersList(io, sessionId);

    console.log(`[Socket] Operator handoff: ${user.name} -> ${target.name} in session ${sessionId}`);
  });

  // 교대 요청 (standby → operator)
  socket.on('operator:request', async (data: { sessionId: string }) => {
    const { sessionId } = data;
    const room = getSessionRoom(sessionId);
    const members = sessionMembers.get(sessionId);
    if (!members) return;

    const requester = members.get(user.userId);
    if (!requester || requester.role !== 'standby') return;

    // 현재 operator 찾기 (첫 번째)
    const currentOperator = Array.from(members.values()).find((m) => m.role === 'operator');
    if (!currentOperator) return;

    // DB에서 role 교체 (트랜잭션)
    await prisma.$transaction([
      prisma.sessionMember.updateMany({
        where: { sessionId, userId: currentOperator.userId, role: 'operator' },
        data: { role: 'standby' },
      }),
      prisma.sessionMember.updateMany({
        where: { sessionId, userId: user.userId, role: 'standby' },
        data: { role: 'operator' },
      }),
    ]);

    // 메모리 업데이트
    currentOperator.role = 'standby';
    requester.role = 'operator';

    // 전체에 교대 알림
    io.to(room).emit('operator:switched', {
      newOperatorUserId: user.userId,
      newOperatorName: user.name,
      oldOperatorUserId: currentOperator.userId,
      oldOperatorName: currentOperator.name,
    });

    // 멤버 목록 재전송
    broadcastMembersList(io, sessionId);

    console.log(`[Socket] Operator switched: ${currentOperator.name} -> ${user.name} in session ${sessionId}`);
  });

  // 연결 해제
  socket.on('disconnect', () => {
    // 모든 세션에서 해당 유저 제거
    for (const [sessionId, members] of sessionMembers.entries()) {
      if (members.has(user.userId)) {
        leaveSession(io, socket, sessionId, user);
      }
    }
    console.log(`[Socket] ${user.name} disconnected`);
  });
}

async function leaveSession(io: Server, socket: Socket, sessionId: string, user: AuthPayload): Promise<void> {
  const room = getSessionRoom(sessionId);
  socket.leave(room);

  const members = sessionMembers.get(sessionId);
  if (!members) return;

  const leavingMember = members.get(user.userId);
  members.delete(user.userId);

  if (members.size === 0) {
    sessionMembers.delete(sessionId);
  } else if (leavingMember?.role === 'operator') {
    // operator가 나갔으면 첫 번째 standby를 operator로 승격
    const nextStandby = Array.from(members.values()).find((m) => m.role === 'standby');
    if (nextStandby) {
      await prisma.sessionMember.updateMany({
        where: { sessionId, userId: nextStandby.userId },
        data: { role: 'operator' },
      }).catch(() => {});

      nextStandby.role = 'operator';

      io.to(room).emit('operator:switched', {
        newOperatorUserId: nextStandby.userId,
        newOperatorName: nextStandby.name,
        oldOperatorUserId: user.userId,
        oldOperatorName: user.name,
      });

      console.log(`[Socket] Auto-promoted ${nextStandby.name} to operator (${user.name} left)`);
    }
  }

  // 남은 멤버들에게 퇴장 알림 + 목록 갱신
  io.to(room).emit('member:left', { userId: user.userId });
  broadcastMembersList(io, sessionId);

  console.log(`[Socket] ${user.name} left session ${sessionId}`);
}

// 세션 종료 시 전체 알림 (REST API에서 호출용)
export function notifySessionEnded(io: Server, sessionId: string): void {
  const room = getSessionRoom(sessionId);
  io.to(room).emit('session:ended', { sessionId });
  sessionMembers.delete(sessionId);
}
