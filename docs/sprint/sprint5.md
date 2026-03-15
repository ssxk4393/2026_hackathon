# Sprint 5: WebSocket 실시간 통신

## 기간
2026-03-15 ~
**상태**: COMPLETED

## 목표
여러 PC의 속기사가 실시간으로 같은 세션에서 협업할 수 있도록 WebSocket 통신을 구축한다.

## 구현 내역

### 서버 — Socket.io 서버 (`server/src/socket/`)

| 파일 | 설명 |
|------|------|
| `index.ts` | Socket.io 서버 초기화, HTTP 서버와 같은 포트(3000) 공유 |
| `auth.ts` | handshake 시 JWT 인증 미들웨어 (기존 `verifyToken` 재사용) |
| `handlers.ts` | 세션 room 관리, 자막/송출전환/멤버 이벤트 처리 |

- `server/src/index.ts`를 `http.createServer` 방식으로 변경하여 Express + Socket.io 동시 동작

### 이벤트 설계

**Client → Server**
| 이벤트 | 설명 |
|--------|------|
| `session:join` | 세션 room 입장 |
| `session:leave` | 세션 room 퇴장 |
| `caption:send` | 자막 송출 (브로드캐스트 + DB 저장) |
| `operator:switch` | 송출 담당자 전환 |

**Server → Client**
| 이벤트 | 설명 |
|--------|------|
| `caption:broadcast` | 자막 브로드캐스트 |
| `operator:switched` | 송출자 변경 알림 |
| `member:joined` | 멤버 입장 알림 |
| `member:left` | 멤버 퇴장 알림 |
| `members:list` | 현재 접속자 목록 (입장 시 전송) |
| `session:ended` | 세션 종료 알림 |

### 프론트엔드

| 파일 | 설명 |
|------|------|
| `src/renderer/services/socketService.ts` | **신규** — Socket.io 클라이언트 래퍼 (연결/해제/재연결/이벤트) |
| `src/renderer/stores/socketStore.ts` | **신규** — 연결 상태, 온라인 멤버, 마지막 수신 자막 |
| `src/renderer/stores/appStore.ts` | **수정** — 세션 모드에서 WebSocket으로 자막 전송 (IPC + Socket 동시) |
| `src/renderer/App.tsx` | **수정** — 세션 입장 시 Socket 연결, 퇴장 시 해제 |
| `src/renderer/components/StatusBar.tsx` | **수정** — 연결 상태 표시 (온라인/연결중/재연결/로컬모드) |

### 공유 타입
- `src/shared/types.ts` — `ClientToServerEvents`, `ServerToClientEvents`, `OnlineMember` 타입 추가

## 데이터 흐름

```
[속기사 A의 PC]                    [서버]                    [속기사 B의 PC]

 textarea → Enter
   ├─ IPC → CaptionWindow (로컬)
   └─ Socket.io → caption:send
                     │
                     ├─ broadcast → caption:broadcast → appStore 갱신
                     │                                    └─ IPC → CaptionWindow (B의 로컬)
                     └─ DB 저장 (CaptionLog)
```

## 핵심 설계 결정

1. **IPC + WebSocket 공존**: 로컬 CaptionWindow는 IPC, 원격 동기화는 Socket.io
2. **세션 없으면 로컬 모드**: 기존 기능 100% 유지
3. **자막 로그 중복 방지**: Socket 모드에서는 서버 handler가 DB 저장, HTTP 폴백은 Socket 미연결 시만
4. **자동 재연결**: reconnectionDelay 1~10초, 재연결 중에도 로컬 IPC 정상 동작

## 검증 체크리스트
- [x] Socket.io 서버 엔드포인트 응답 확인
- [x] 세션 입장 시 Socket 연결 + room 입장
- [x] 자막 입력 시 다른 클라이언트에 브로드캐스트
- [x] 접속자 목록 실시간 표시
- [x] 연결 끊김 → 재연결 시 로컬 모드 유지
- [x] 세션 종료 시 전체 클라이언트에 알림

---

## 일일 진행 기록

### Day 1: 서버 Socket.io 구축
- Socket.io 서버 초기화 (`server/src/socket/index.ts`)
- JWT 기반 handshake 인증 미들웨어 구현
- 세션 room 관리 로직 설계 (session:${id} 네이밍)
- **블로킹 이슈**: Express + Socket.io 동일 포트 공유 → `http.createServer` 방식으로 전환하여 해결
- **의사결정**: Socket.io vs raw WebSocket → Socket.io 선택 (자동 재연결, room 추상화, 폴백 지원)

### Day 2: 이벤트 핸들러 + 클라이언트 연동
- 6개 서버 이벤트 핸들러 구현 (session:join/leave, caption:send/broadcast, operator:switch, members:list)
- socketService.ts 클라이언트 래퍼 작성 (싱글톤 패턴)
- socketStore.ts Zustand 스토어 신규 생성
- appStore.ts 수정: 세션 모드에서 IPC + WebSocket 동시 전송
- **블로킹 이슈**: CORS 오류 (Electron 렌더러 origin) → Socket.io CORS 설정에 localhost:5173, 5174 추가
- **의사결정**: 자막 DB 저장 위치 → Socket 핸들러에서 저장 (HTTP와 중복 방지)

### Day 3: 상태 동기화 + 테스트
- App.tsx 세션 입장/퇴장 시 Socket 연결 라이프사이클 구현
- StatusBar 연결 상태 실시간 표시 (connected/connecting/reconnecting/disconnected)
- 접속자 목록 실시간 브로드캐스트 검증
- 2대 PC 연동 테스트 완료
- **의사결정**: 재연결 전략 → reconnectionDelay 1~10초 점진적 증가, 무한 재시도

---

## 블로킹 이슈 및 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| Express + Socket.io 포트 충돌 | express.listen()과 Socket.io가 별도 HTTP 서버 필요 | `http.createServer(app)` 공유 서버 패턴 적용 |
| CORS 오류 | Electron 렌더러의 origin이 localhost:5173 | Socket.io cors 설정에 명시적 origin 추가 |
| 자막 DB 중복 저장 | HTTP(/sessions/:id/captions)와 Socket 핸들러 모두 저장 | Socket 모드에서는 핸들러가 저장, HTTP는 폴백용 |
| 재연결 시 세션 상태 유실 | 소켓 재연결 후 room에 재입장 안 됨 | Sprint 8에서 reconnect 시 자동 재입장 로직 추가 |
