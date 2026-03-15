/**
 * 대화형 다중 사용자 테스트 스크립트
 *
 * 사용법:
 *   node scripts/interactive-test.mjs <sessionId>
 *
 * 가짜 유저 "테스터_김"을 세션에 참가시키고,
 * 터미널에서 직접 명령을 입력하여 테스트합니다.
 *
 * 명령어:
 *   아무 텍스트 입력 + Enter  → 테스터_김이 자막 송출
 *   /switch                   → 테스터_김이 교대 요청
 *   /leave                    → 테스터_김이 세션 퇴장
 *   /quit                     → 스크립트 종료
 */

import { io } from 'socket.io-client';
import { createInterface } from 'readline';

const SERVER = 'http://localhost:3000';

async function createGuestUser(name) {
  const res = await fetch(`${SERVER}/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
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

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.log('사용법: node scripts/interactive-test.mjs <sessionId>');
    console.log('세션 ID를 인자로 넘겨주세요.');
    process.exit(1);
  }

  console.log('=== 대화형 테스트 시작 ===\n');

  // 가짜 유저 생성 + 세션 참가
  const user = await createGuestUser('테스터_김');
  console.log(`유저 생성: 테스터_김`);

  const joinResult = await joinSession(user.token, sessionId);
  console.log(`세션 참가: ${joinResult.role || joinResult.message}\n`);

  // 소켓 연결
  const socket = io(SERVER, {
    auth: { token: user.token },
    reconnection: false,
  });

  socket.on('connect', () => {
    console.log('[연결됨] 소켓 연결 완료');
    socket.emit('session:join', { sessionId });
  });

  socket.on('members:list', (members) => {
    console.log(`[멤버] ${members.map(m => `${m.name}(${m.role})`).join(', ')}`);
  });

  socket.on('caption:broadcast', (data) => {
    console.log(`[자막 수신] "${data.text}" ← ${data.userName}`);
  });

  socket.on('operator:switched', (data) => {
    console.log(`[교대!] ${data.oldOperatorName} → ${data.newOperatorName}`);
  });

  socket.on('member:joined', (data) => {
    console.log(`[입장] ${data.name} (${data.role})`);
  });

  socket.on('member:left', (data) => {
    console.log(`[퇴장] ${data.userId}`);
  });

  socket.on('session:ended', () => {
    console.log('[세션 종료됨]');
    process.exit(0);
  });

  // 잠시 대기 후 안내
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n──────────────────────────────────────');
  console.log('  명령어 안내:');
  console.log('  텍스트 입력 + Enter  → 테스터_김이 자막 송출');
  console.log('  /switch              → 교대 요청 (operator 가져오기)');
  console.log('  /leave               → 세션 퇴장');
  console.log('  /quit                → 스크립트 종료');
  console.log('──────────────────────────────────────\n');

  // 대화형 입력
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '테스터_김> ',
  });

  rl.prompt();

  rl.on('line', (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input === '/switch') {
      socket.emit('operator:request', { sessionId });
      console.log('[요청] 교대 요청 전송!\n');
    } else if (input === '/leave') {
      socket.emit('session:leave', { sessionId });
      console.log('[퇴장] 세션을 나갑니다.\n');
    } else if (input === '/quit') {
      socket.disconnect();
      process.exit(0);
    } else {
      // 자막 송출
      socket.emit('caption:send', { sessionId, text: input });
      console.log(`[송출] "${input}"\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    socket.disconnect();
    process.exit(0);
  });
}

main().catch(console.error);
