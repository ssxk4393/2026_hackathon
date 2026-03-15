/**
 * 다중 사용자 테스트 스크립트
 *
 * 사용법:
 *   node scripts/test-multi-user.mjs <sessionId>
 *
 * 1. 서버가 실행 중이어야 합니다 (cd server && npm run dev)
 * 2. Electron 앱에서 세션을 생성합니다
 * 3. 세션 ID를 인자로 넘겨 실행하면 가짜 유저 2명이 참가합니다
 *
 * 세션 ID 없이 실행하면 새 세션을 만들고 3명이 참가합니다.
 */

import { io } from 'socket.io-client';

const SERVER = 'http://localhost:3000';

async function createGuestUser(name) {
  const res = await fetch(`${SERVER}/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

async function createSession(token, name, maxOperators) {
  const res = await fetch(`${SERVER}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, maxOperators }),
  });
  return res.json();
}

async function joinSession(token, sessionId) {
  const res = await fetch(`${SERVER}/sessions/${sessionId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

function connectUser(token, userName, sessionId) {
  return new Promise((resolve) => {
    const socket = io(SERVER, {
      auth: { token },
      reconnection: false,
    });

    socket.on('connect', () => {
      console.log(`[${userName}] 소켓 연결 완료`);
      socket.emit('session:join', { sessionId });
    });

    socket.on('members:list', (members) => {
      console.log(`[${userName}] 접속자 목록:`, members.map(m => `${m.name}(${m.role})`).join(', '));
    });

    socket.on('caption:broadcast', (data) => {
      console.log(`[${userName}] 자막 수신: "${data.text}" (from ${data.userName})`);
    });

    socket.on('operator:switched', (data) => {
      console.log(`[${userName}] 교대! ${data.oldOperatorName} → ${data.newOperatorName}`);
    });

    socket.on('member:joined', (data) => {
      console.log(`[${userName}] ${data.name} 입장 (${data.role})`);
    });

    socket.on('member:left', (data) => {
      console.log(`[${userName}] 유저 퇴장: ${data.userId}`);
    });

    socket.on('session:ended', () => {
      console.log(`[${userName}] 세션 종료됨!`);
    });

    resolve({ socket, userName });
  });
}

// 자막 전송 시뮬레이션
function simulateCaptions(socket, userName, sessionId) {
  const captions = [
    '안녕하세요, 테스트 자막입니다.',
    '두 번째 자막을 보내봅니다.',
    '세 번째 자막! 실시간으로 전달되나요?',
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i >= captions.length) {
      clearInterval(interval);
      console.log(`[${userName}] 자막 전송 완료`);
      return;
    }
    const text = captions[i];
    socket.emit('caption:send', { sessionId, text });
    console.log(`[${userName}] 자막 송출: "${text}"`);
    i++;
  }, 3000);

  return interval;
}

async function main() {
  const sessionIdArg = process.argv[2];

  console.log('=== 다중 사용자 테스트 시작 ===\n');

  // 유저 생성
  const userA = await createGuestUser('테스터_김');
  const userB = await createGuestUser('테스터_이');
  const userC = await createGuestUser('테스터_박');
  console.log('유저 3명 생성 완료\n');

  let sessionId = sessionIdArg;

  if (!sessionId) {
    // 세션 생성
    const session = await createSession(userA.token, '테스트 세션', 2);
    sessionId = session.id;
    console.log(`세션 생성: ${session.name} (ID: ${sessionId})`);
    console.log(`maxOperators: 2\n`);
  }

  // 세션 참가 (REST)
  const joinA = await joinSession(userA.token, sessionId);
  console.log(`테스터_김 참가: ${joinA.role || joinA.message}`);

  const joinB = await joinSession(userB.token, sessionId);
  console.log(`테스터_이 참가: ${joinB.role || joinB.message}`);

  const joinC = await joinSession(userC.token, sessionId);
  console.log(`테스터_박 참가: ${joinC.role} (3번째 → standby 예상)`);
  console.log('');

  // 소켓 연결
  const connA = await connectUser(userA.token, '테스터_김', sessionId);
  await new Promise(r => setTimeout(r, 500));
  const connB = await connectUser(userB.token, '테스터_이', sessionId);
  await new Promise(r => setTimeout(r, 500));
  const connC = await connectUser(userC.token, '테스터_박', sessionId);
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- 3초 후 테스터_김이 자막 전송 시작 ---\n');
  await new Promise(r => setTimeout(r, 3000));

  // operator(테스터_김)가 자막 전송
  simulateCaptions(connA.socket, '테스터_김', sessionId);

  // 12초 후 교대 요청
  console.log('\n--- 12초 후 테스터_박(standby)이 교대 요청 ---\n');
  await new Promise(r => setTimeout(r, 12000));

  connC.socket.emit('operator:request', { sessionId });
  console.log('[테스터_박] 교대 요청 전송!\n');

  // 5초 대기 후 종료
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n=== 테스트 완료! Ctrl+C로 종료 ===');
  console.log(`세션 ID: ${sessionId}`);
  console.log('이 세션 ID를 앱에서 참가하면 실시간 동작을 확인할 수 있습니다.');

  // 30초 후 자동 종료
  setTimeout(() => {
    connA.socket.disconnect();
    connB.socket.disconnect();
    connC.socket.disconnect();
    process.exit(0);
  }, 30000);
}

main().catch(console.error);
