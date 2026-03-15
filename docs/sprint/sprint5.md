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
