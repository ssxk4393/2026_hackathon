# Realtime Caption Studio - 시스템 아키텍처 문서

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [기술 스택 상세](#2-기술-스택-상세)
3. [아키텍처 다이어그램](#3-아키텍처-다이어그램)
4. [프로세스 구조](#4-프로세스-구조)
5. [데이터 흐름](#5-데이터-흐름)
6. [데이터 모델 (ERD)](#6-데이터-모델-erd)
7. [API 설계](#7-api-설계)
8. [WebSocket 이벤트 설계](#8-websocket-이벤트-설계)
9. [IPC 채널 설계](#9-ipc-채널-설계)
10. [멀티모니터 지원](#10-멀티모니터-지원)
11. [보안 설계](#11-보안-설계)
12. [성능 최적화](#12-성능-최적화)
13. [테스트 전략](#13-테스트-전략)
14. [에러 핸들링 전략](#14-에러-핸들링-전략)
15. [디자인 시스템](#15-디자인-시스템)
16. [빌드 및 배포](#16-빌드-및-배포)

---

## 1. 시스템 개요

### 1.1 프로젝트 정의

Realtime Caption Studio는 속기사(Stenographer)가 실시간으로 자막을 입력하고 별도 모니터에 송출하는 데스크탑 애플리케이션이다. 2명 이상의 속기사가 동시에 협업하며, 교대(Handoff) 시스템을 통해 끊김 없는 자막 송출을 보장한다.

### 1.2 핵심 문제 정의

| 기존 자막 작업의 문제 | 본 시스템의 해결 방안 |
|---|---|
| 단일 속기사 피로 누적 | 최대 4명 속기사 교대 시스템 |
| 자막 전환 시 끊김 | 실시간 IPC + WebSocket 동시 송출 |
| 물리적으로 같은 공간 필요 | 세션 기반 원격 협업 지원 |
| 자막 스타일 조정 번거로움 | 실시간 프리뷰 + 5종 프리셋 |
| 자막 이력 관리 불가 | DB 기반 자막 로그 + 내보내기 |

### 1.3 듀얼 모드 아키텍처

시스템은 두 가지 모드로 동작한다.

**로컬 모드 (Local Mode)**
- 서버 연결 없이 단독 실행
- Electron IPC로 속기사 작업창과 자막 출력창 간 통신
- F1~F4 단축키로 속기사 전환
- 네트워크 불가 환경에서도 동작 보장

**세션 모드 (Session Mode)**
- Express 서버에 HTTP + WebSocket 연결
- JWT 인증 기반 다중 사용자 협업
- 실시간 자막 브로드캐스트 + DB 로깅
- operator/standby 역할 기반 교대 시스템

---

## 2. 기술 스택 상세

### 2.1 프론트엔드

| 기술 | 버전 | 선택 근거 |
|------|------|-----------|
| **Electron** | v33.3 | 크로스 플랫폼 데스크탑 앱. 듀얼 모니터 제어, 투명 오버레이 창, 커스텀 프로토콜(딥링크) 지원이 핵심 요구사항과 일치 |
| **React** | v18.3 | 컴포넌트 기반 UI 재사용성. Hooks를 활용한 상태 관리. 방대한 생태계와 커뮤니티 |
| **TypeScript** | v5.7 | 정적 타입으로 IPC 채널, WebSocket 이벤트, API 응답의 타입 안전성 확보. 런타임 오류 사전 방지 |
| **Zustand** | v5.0 | Redux 대비 보일러플레이트 80% 감소. 미들웨어 없이 직관적인 스토어 패턴. 번들 사이즈 1.1KB (gzip) |
| **Tailwind CSS** | v3.4 | 커스텀 디자인 토큰(surface, accent, text) 정의. 유틸리티 기반으로 일관된 UI. 빠른 프로토타이핑 |
| **Vite** | v6.2 | Electron + React 개발 환경 최적화. HMR(Hot Module Replacement)으로 개발 속도 극대화. vite-plugin-electron으로 main/renderer 동시 빌드 |

### 2.2 백엔드

| 기술 | 버전 | 선택 근거 |
|------|------|-----------|
| **Express.js** | v4.21 | 최소한의 설정으로 REST API 구축. 미들웨어 패턴으로 인증/에러처리 레이어 분리 |
| **Prisma** | v6.5 | 타입 안전한 ORM. 스키마 기반 자동 마이그레이션. TypeScript와 완벽 통합 |
| **SQLite** | - | 설치 없이 즉시 사용 가능한 임베디드 DB. 개발/테스트 환경에서 제로 설정. PostgreSQL 마이그레이션 대비 Prisma 추상화 |
| **Socket.io** | v4.8 | WebSocket + HTTP long-polling 자동 폴백. Room 기반 세션 관리. 자동 재연결(1~10초 백오프). 네임스페이스 분리 |
| **JWT** | v9.0 | Stateless 인증으로 서버 세션 관리 불필요. 7일 만료로 속기사 재인증 부담 최소화. 게스트 로그인과 OAuth 동일 토큰 형식 |

### 2.3 개발 도구

| 도구 | 용도 |
|------|------|
| **Vitest** | Vite 네이티브 테스트 러너. 서버/클라이언트 통합 테스트 |
| **Supertest** | Express API 엔드포인트 통합 테스트 |
| **Testing Library** | React 컴포넌트 단위 테스트 |
| **electron-builder** | Windows NSIS 인스톨러 생성 |
| **tsx** | TypeScript 서버 핫 리로드 개발 |

---

## 3. 아키텍처 다이어그램

### 3.1 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Realtime Caption Studio                             │
│                                                                             │
│  ┌──────────────────── Electron App (속기사 A의 PC) ────────────────────┐   │
│  │                                                                      │   │
│  │  ┌─────────────────┐    IPC     ┌──────────────────────────┐        │   │
│  │  │   Main Process  │◄──────────►│   Renderer (React App)   │        │   │
│  │  │                 │            │                          │        │   │
│  │  │  - 윈도우 관리   │            │  - StenographerPanel     │        │   │
│  │  │  - IPC 라우팅    │            │  - StandbyPanel          │        │   │
│  │  │  - 설정 I/O     │            │  - StyleSettingsPanel    │        │   │
│  │  │  - 딥링크 처리   │            │  - ControlBar            │        │   │
│  │  │                 │            │  - SessionLobby          │        │   │
│  │  └────────┬────────┘            │  - LoginPage             │        │   │
│  │           │                     │                          │        │   │
│  │           │ IPC                 │  Zustand Stores:         │        │   │
│  │           │ (caption:display)   │  - appStore (자막/세션)   │        │   │
│  │           │ (style:display)     │  - socketStore (연결상태) │        │   │
│  │           ▼                     │                          │        │   │
│  │  ┌─────────────────┐           └────────────┬─────────────┘        │   │
│  │  │ Caption Window  │                        │                       │   │
│  │  │ (2번째 모니터)   │                        │ HTTP + WebSocket      │   │
│  │  │                 │                        │                       │   │
│  │  │ - 투명 오버레이  │                        │                       │   │
│  │  │ - alwaysOnTop   │                        │                       │   │
│  │  │ - frameless     │                        │                       │   │
│  │  └─────────────────┘                        │                       │   │
│  └─────────────────────────────────────────────┼───────────────────────┘   │
│                                                │                           │
│                                                ▼                           │
│  ┌──────────────────── Express Server (port 3000) ─────────────────────┐   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │  REST API     │  │  Socket.io   │  │  Prisma + SQLite         │   │   │
│  │  │              │  │              │  │                          │   │   │
│  │  │  /auth/*     │  │  session:*   │  │  User                   │   │   │
│  │  │  /sessions/* │  │  caption:*   │  │  Session                │   │   │
│  │  │  /users/*    │  │  operator:*  │  │  SessionMember          │   │   │
│  │  │              │  │  member:*    │  │  CaptionLog             │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                   ▲ WebSocket                              │
│                                   │                                         │
│  ┌──────────────────── Electron App (속기사 B의 PC) ────────────────────┐   │
│  │                        (동일 구조)                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 프로세스 간 통신 구조

```
┌─────────────┐          contextBridge          ┌──────────────────┐
│  Renderer   │  ◄──────────────────────────►   │  Main Process    │
│  Process    │    electronAPI.updateCaption()   │                  │
│  (React)    │    electronAPI.updateStyle()     │  ipcMain.handle  │
│             │    electronAPI.openCaptionWin()  │                  │
└──────┬──────┘                                  └────────┬─────────┘
       │                                                  │
       │  Socket.io Client                                │  webContents.send
       │  (세션 모드에서만)                                │  (항상)
       │                                                  │
       ▼                                                  ▼
┌──────────────┐                                ┌──────────────────┐
│  Express     │                                │  Caption Window  │
│  Server      │                                │  (별도 프로세스)  │
│              │                                │                  │
│  Socket.io   │                                │  caption:display │
│  Room 관리   │                                │  style:display   │
└──────────────┘                                └──────────────────┘
```

---

## 4. 프로세스 구조

### 4.1 Electron Main Process (`src/main/index.ts`)

Main Process는 Electron 애플리케이션의 핵심 프로세스로, 다음을 담당한다.

| 책임 | 상세 |
|------|------|
| 윈도우 생명주기 관리 | mainWindow 생성/소멸, captionWindow 생성/소멸 |
| IPC 라우팅 | Renderer의 요청을 Caption Window로 중계 |
| 멀티 모니터 제어 | `screen.getAllDisplays()`로 외부 디스플레이 감지, 자막 창 배치 |
| 설정 영속화 | `app.getPath('userData')/user-settings.json`에 스타일/속기사 설정 저장 |
| 딥링크 처리 | `caption-studio://` 프로토콜로 OAuth 콜백 수신 |
| 싱글 인스턴스 보장 | `app.requestSingleInstanceLock()`으로 중복 실행 방지 |

**보안 설정:**
```
nodeIntegration: false     (Node.js API 직접 접근 차단)
contextIsolation: true     (렌더러와 preload 컨텍스트 분리)
```

### 4.2 Preload Script (`src/main/preload.ts`)

contextBridge를 통해 Renderer에 안전하게 노출되는 API 목록:

| API | 용도 | 방향 |
|-----|------|------|
| `updateCaption(text)` | 자막 텍스트 전송 | Renderer -> Main -> Caption |
| `switchOperator(id)` | 송출 담당자 전환 | Renderer -> Main |
| `updateStyle(style)` | 자막 스타일 변경 | Renderer -> Main -> Caption |
| `openCaptionWindow()` | 자막 창 열기 | Renderer -> Main |
| `closeCaptionWindow()` | 자막 창 닫기 | Renderer -> Main |
| `loadSettings()` | 사용자 설정 로드 | Renderer -> Main |
| `saveSettings(settings)` | 사용자 설정 저장 | Renderer -> Main |
| `openExternal(url)` | 외부 브라우저 열기 | Renderer -> Main |
| `onCaptionUpdate(cb)` | 자막 수신 리스너 | Main -> Caption Window |
| `onStyleUpdate(cb)` | 스타일 수신 리스너 | Main -> Caption Window |
| `onCaptionWindowClosed(cb)` | 자막 창 닫힘 알림 | Main -> Renderer |
| `onAuthCallback(cb)` | OAuth 토큰 수신 | Main -> Renderer |

### 4.3 Renderer Process (`src/renderer/`)

React 18 기반의 속기사 작업 화면이다. 역할에 따라 다른 UI를 렌더링한다.

```
인증 상태 분기:
  미인증        → LoginPage (게스트/카카오 로그인)
  인증 + 세션X  → SessionLobby (세션 목록/생성/참가)
  인증 + 세션O  → 작업 화면 (role 기반 분기)

작업 화면 role 분기:
  operator      → StenographerPanel (자막 입력 + LIVE 송출)
  standby       → StenographerPanel (연습 입력) + StandbyPanel (모니터링 + 교대 요청)
```

### 4.4 Caption Window (`src/caption-window/`)

별도 BrowserWindow로 생성되는 자막 출력 전용 화면이다.

| 속성 | 값 | 설명 |
|------|-----|------|
| `alwaysOnTop` | true | 다른 프로그램 위에 항상 표시 |
| `frame` | false | 타이틀 바 없음 |
| `transparent` | true | 배경 투명 (오버레이 효과) |
| `resizable` | true | 크기 조절 가능 |
| `skipTaskbar` | true | 작업 표시줄에 미표시 |

**멀티 모니터 배치 로직:**
```
displays = screen.getAllDisplays()
externalDisplay = displays.find(d => d.id !== primaryDisplay.id) ?? primaryDisplay

위치: 외부 디스플레이의 가로 10% 오프셋, 세로 60% 위치
크기: 외부 디스플레이 가로의 80%, 높이 200px
```

---

## 5. 데이터 흐름

### 5.1 로컬 모드 자막 송출 흐름

```
[속기사 작업창]                    [Main Process]              [자막 출력창]

 textarea 입력
     │
     ▼
 appStore.updateCaptionText()
     │
     ├── set({ captionTexts })     (Zustand 상태 갱신)
     │
     └── electronAPI.updateCaption(text)
               │
               ▼
          ipcMain.handle('caption:update')
               │
               ▼
          captionWindow.webContents.send('caption:display', text)
                                              │
                                              ▼
                                        [자막 렌더링]
                                        (투명 오버레이)
```

**특징:** IPC 직통 전송으로 지연 없음 (< 1ms)

### 5.2 세션 모드 자막 송출 흐름

```
[속기사 A - Operator]           [서버]                    [속기사 B - Standby]

 textarea 입력
     │
     ▼
 appStore.updateCaptionText()
     │
     ├── 로컬 IPC (즉시)  ──────────────────────────── [A의 자막 출력창]
     │   electronAPI.updateCaption(text)
     │
     └── WebSocket (50ms 디바운스)
         socketSendCaption(sessionId, text)
               │
               ▼
          socket.emit('caption:send')
               │
               ▼
          [서버] handlers.ts
               │
               ├── socket.to(room).emit('caption:broadcast')  ─────►  socketStore.setLastCaption()
               │                                                            │
               │                                                            ▼
               │                                                   electronAPI.updateCaption()
               │                                                            │
               │                                                            ▼
               │                                                   [B의 자막 출력창]
               │
               └── prisma.captionLog.create()  (비동기 DB 저장)
```

**핵심 설계:** 로컬 IPC는 즉시 전송(지연 0ms), WebSocket은 50ms 디바운스로 네트워크 트래픽 최적화. DB 저장 실패는 브로드캐스트에 영향을 주지 않음.

### 5.3 인증 흐름

```
[게스트 로그인]
 닉네임 입력 → POST /auth/guest → User 생성 → JWT 발급 → localStorage 저장 → setAuthToken()

[카카오 OAuth]
 로그인 버튼 → GET /auth/kakao → 카카오 인증 페이지 (외부 브라우저)
     → 콜백 → GET /auth/kakao/callback → 카카오 토큰 → 유저 정보 → User upsert → JWT 발급
     → caption-studio://auth/callback?token=...&name=... (딥링크)
     → Main Process handleDeepLink() → mainWindow.webContents.send('auth:callback')
     → Renderer onAuthCallback → localStorage 저장
```

### 5.4 교대(Handoff) 흐름

```
[Standby 속기사]           [서버]                    [전체 클라이언트]

 "송출 교대 요청" 클릭
     │
     ▼
 socket.emit('operator:request')
     │
     ▼
 [서버] handlers.ts
     │
     ├── 유효성 검증 (요청자=standby, 현재 operator 존재)
     │
     ├── prisma.$transaction([
     │     현재 operator → standby,
     │     요청자 → operator
     │   ])
     │
     ├── io.to(room).emit('operator:switched', {
     │     newOperatorUserId, newOperatorName,
     │     oldOperatorUserId, oldOperatorName
     │   })
     │
     └── broadcastMembersList(io, sessionId)
              │
              ▼
         [모든 클라이언트]
         socketStore.updateMemberRole()
         → UI 자동 전환 (operator ↔ standby 패널)
```

---

## 6. 데이터 모델 (ERD)

### 6.1 Entity Relationship Diagram

```
┌──────────────────────┐
│        User          │
├──────────────────────┤
│ id        STRING  PK │
│ email     STRING? UQ │
│ name      STRING     │
│ avatar    STRING?    │
│ provider  STRING     │──── kakao | naver | guest
│ providerId STRING?   │
│ createdAt DATETIME   │
│ updatedAt DATETIME   │
├──────────────────────┤
│ UNIQUE(provider,     │
│        providerId)   │
└──────────┬───────────┘
           │
           │ 1:N (createdSessions)
           │
           ▼
┌──────────────────────┐         ┌──────────────────────┐
│       Session        │         │    SessionMember      │
├──────────────────────┤         ├──────────────────────┤
│ id        STRING  PK │◄───────│ sessionId STRING  FK │
│ name      STRING     │   1:N  │ userId    STRING  FK │──► User
│ status    STRING     │──active│ id        STRING  PK │
│ maxOperators INT     │  ended │ role      STRING     │──── operator | standby
│ createdBy STRING  FK │        │ joinedAt  DATETIME   │
│ createdAt DATETIME   │        │ leftAt    DATETIME?  │
│ endedAt   DATETIME?  │        ├──────────────────────┤
└──────────┬───────────┘        │ UNIQUE(sessionId,    │
           │                    │        userId)       │
           │ 1:N                └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│     CaptionLog       │
├──────────────────────┤
│ id        STRING  PK │
│ sessionId STRING  FK │
│ userId    STRING     │
│ text      STRING     │
│ createdAt DATETIME   │
└──────────────────────┘
```

### 6.2 모델 관계 요약

| 관계 | 설명 |
|------|------|
| User → Session | 1:N (한 유저가 여러 세션 생성 가능) |
| Session → SessionMember | 1:N (한 세션에 여러 멤버 참가) |
| User → SessionMember | 1:N (한 유저가 여러 세션에 참가) |
| Session → CaptionLog | 1:N (한 세션에 여러 자막 로그) |
| SessionMember | 복합 유니크: (sessionId, userId) - 중복 참가 방지 |

### 6.3 클라이언트 측 타입 (shared/types.ts)

서버 DB 모델과 별도로, Electron IPC 및 로컬 모드에서 사용하는 클라이언트 타입이 존재한다.

| 타입 | 용도 |
|------|------|
| `Stenographer` | 로컬 모드 속기사 (id, name, isActive) |
| `Caption` | 자막 텍스트 + 타임스탬프 |
| `CaptionStyle` | 폰트, 크기, 색상, 배경, 위치 등 스타일 |
| `StylePreset` | 프리셋 (기본/방송용/강연용/고대비/미니멀) |
| `UserSettings` | 사용자 설정 (스타일 + 속기사 + 마지막 송출자) |
| `SessionInfo` | 세션 전체 정보 (멤버 포함) |
| `OnlineMember` | 실시간 접속 멤버 (userId, name, role) |

---

## 7. API 설계

### 7.1 REST API 엔드포인트

**인증 (Public)**

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/auth/kakao` | 카카오 로그인 URL 생성 |
| GET | `/auth/kakao/callback` | 카카오 OAuth 콜백 처리 |
| POST | `/auth/guest` | 게스트 로그인 (닉네임 기반) |
| GET | `/auth/me` | 현재 토큰 검증 + 유저 정보 |

**세션 (인증 필요: Bearer Token)**

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/sessions` | 활성 세션 목록 조회 |
| POST | `/sessions` | 새 세션 생성 (생성자 = 첫 operator) |
| GET | `/sessions/:id` | 세션 상세 조회 |
| POST | `/sessions/:id/join` | 세션 참가 (operator/standby 자동 배정) |
| POST | `/sessions/:id/leave` | 세션 나가기 |
| POST | `/sessions/:id/end` | 세션 종료 (생성자만 가능) |
| POST | `/sessions/:id/captions` | 자막 로그 저장 |
| GET | `/sessions/:id/captions` | 자막 이력 조회 |
| GET | `/sessions/:id/export` | 세션 내보내기 (format=json/txt) |

**헬스체크**

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 서버 상태 확인 |

### 7.2 인증 미들웨어

```
요청 → Authorization 헤더 확인 → "Bearer " 접두사 확인 → JWT 검증 → req.user에 페이로드 주입

실패 시: 401 { error: "인증이 필요합니다" } 또는 { error: "유효하지 않은 토큰입니다" }
```

---

## 8. WebSocket 이벤트 설계

### 8.1 연결 흐름

```
Socket.io Client 연결
    │
    ▼
handshake 인증 미들웨어
    │  auth: { token: JWT }
    │
    ├── 성공 → socket.data.user에 AuthPayload 저장
    │
    └── 실패 → 연결 거부
```

### 8.2 Client -> Server 이벤트

| 이벤트 | Payload | 설명 |
|--------|---------|------|
| `session:join` | `{ sessionId: string }` | 세션 Room 입장 + 온라인 멤버 등록 |
| `session:leave` | `{ sessionId: string }` | 세션 Room 퇴장 + 멤버 제거 |
| `caption:send` | `{ sessionId: string, text: string }` | 자막 브로드캐스트 + DB 저장 |
| `operator:switch` | `{ sessionId: string, operatorUserId: string }` | 특정 사용자에게 송출권 이관 |
| `operator:request` | `{ sessionId: string }` | 교대 요청 (standby -> operator) |

### 8.3 Server -> Client 이벤트

| 이벤트 | Payload | 설명 |
|--------|---------|------|
| `caption:broadcast` | `{ text, userId, userName, timestamp }` | 자막 실시간 전달 |
| `operator:switched` | `{ newOperatorUserId/Name, oldOperatorUserId/Name }` | 송출자 변경 알림 |
| `member:joined` | `{ userId, name, role }` | 새 멤버 입장 |
| `member:left` | `{ userId }` | 멤버 퇴장 |
| `members:list` | `OnlineMember[]` | 전체 온라인 멤버 목록 (입장/교대/퇴장 시) |
| `session:ended` | `{ sessionId }` | 세션 종료 알림 |
| `error` | `{ message: string }` | 에러 메시지 |

### 8.4 세션 메모리 관리

서버는 `sessionMembers: Map<sessionId, Map<userId, MemberInfo>>`로 온라인 멤버를 인메모리 추적한다.

| 이벤트 | 메모리 변경 |
|--------|-------------|
| session:join | Map에 멤버 추가 |
| session:leave / disconnect | Map에서 멤버 제거 |
| operator 이탈 | 첫 번째 standby를 operator로 자동 승격 |
| 세션 멤버 전원 퇴장 | Map에서 세션 자체 제거 |

---

## 9. IPC 채널 설계

### 9.1 채널 상수 (`shared/types.ts`)

| 상수명 | 채널명 | 방향 |
|--------|--------|------|
| `CAPTION_UPDATE` | `caption:update` | Renderer -> Main -> Caption |
| `OPERATOR_SWITCH` | `operator:switch` | Renderer -> Main -> Caption |
| `STYLE_UPDATE` | `style:update` | Renderer -> Main -> Caption |
| `WINDOW_CAPTION_OPEN` | `window:caption-open` | Renderer -> Main |
| `WINDOW_CAPTION_CLOSE` | `window:caption-close` | Renderer -> Main |
| `SETTINGS_LOAD` | `settings:load` | Renderer -> Main (응답 포함) |
| `SETTINGS_SAVE` | `settings:save` | Renderer -> Main |

### 9.2 추가 채널 (preload에서 직접 정의)

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `caption:display` | Main -> Caption Window | 자막 텍스트 표시 |
| `style:display` | Main -> Caption Window | 스타일 변경 적용 |
| `caption-window:closed` | Main -> Renderer | 자막 창 닫힘 동기화 |
| `auth:callback` | Main -> Renderer | OAuth 딥링크 토큰 전달 |
| `shell:open-external` | Renderer -> Main | 외부 URL 브라우저 열기 |

---

## 10. 멀티모니터 지원

### 구현 방식
Electron의 `BrowserWindow` API를 활용하여 자막 출력 전용 윈도우를 별도 생성한다.

### 윈도우 구성
| 윈도우 | 역할 | 특성 |
|--------|------|------|
| Main Window | 속기사 작업 화면 | 메인 모니터, 일반 윈도우 |
| Caption Window | 자막 출력 | 보조 모니터, 투명 오버레이, always-on-top |

### Caption Window 특성
- `transparent: true` — 배경 투명 (CSS로 반투명 배경 적용)
- `frame: false` — 프레임 없는 윈도우
- `alwaysOnTop: true` — 항상 최상위 표시
- `resizable: true` — 사용자가 크기 자유 조절
- 드래그 이동 지원 (`-webkit-app-region: drag`)
- ESC 키 잠금/해제 토글

### IPC 데이터 흐름 (멀티모니터)
```
Main Window (Renderer)
    |
    +-- caption:update ----> Main Process ----> Caption Window (webContents.send)
    +-- style:update ------> Main Process ----> Caption Window (webContents.send)
    +-- window:caption-open ----> Main Process (BrowserWindow 생성)
    +-- window:caption-close ---> Main Process (BrowserWindow 닫기)
                                    |
                              caption-window:closed ----> Main Window (상태 동기화)
```

### 모니터 감지
- Electron `screen` API로 사용 가능한 디스플레이 목록 조회
- 자막 창은 기본적으로 두 번째 모니터에 위치 (없으면 메인 모니터)
- 사용자가 드래그로 원하는 모니터로 이동 가능

---

## 11. 보안 설계

### 11.1 Electron 보안

| 항목 | 설정 | 설명 |
|------|------|------|
| `nodeIntegration` | `false` | Renderer에서 Node.js API 접근 완전 차단 |
| `contextIsolation` | `true` | Preload 스크립트와 Renderer 컨텍스트 완전 분리 |
| `contextBridge` | 사용 | 허용된 API만 명시적으로 노출 (화이트리스트 방식) |
| 싱글 인스턴스 | `requestSingleInstanceLock` | 다중 인스턴스 실행 방지 |

### 11.2 서버 보안

| 항목 | 구현 | 설명 |
|------|------|------|
| JWT 인증 | 모든 `/sessions/*` 라우트에 `authMiddleware` 적용 | 미인증 요청 차단 |
| JWT 만료 | 7일 (`expiresIn: '7d'`) | 장기 세션 방지 |
| CORS | `origin: ['http://localhost:5173', 'http://localhost:5174']` | 허용 출처 화이트리스트 |
| Socket 인증 | handshake 시 JWT 검증 | 미인증 WebSocket 연결 차단 |
| 입력 검증 | 라우트별 필수 필드 검증 | 빈 닉네임, 빈 자막 텍스트 등 거부 |
| 권한 검증 | 세션 종료는 생성자만, operator 전환은 현재 operator만 | 역할 기반 접근 제어 |
| 환경 변수 | `.env` 파일 (git 미추적) | 비밀 키, API 키 분리 |

### 11.3 클라이언트 보안

| 항목 | 구현 |
|------|------|
| 토큰 저장 | `localStorage`에 JWT 저장 (Electron 환경 특화) |
| 401 자동 처리 | `apiClient`에서 401 응답 시 자동 로그아웃 + 상태 초기화 |
| 외부 URL | `shell.openExternal()`을 통한 안전한 외부 브라우저 실행 |

---

## 12. 성능 최적화

### 12.1 자막 전송 최적화

| 모드 | 전략 | 지연 |
|------|------|------|
| 로컬 IPC | 디바운스 없이 즉시 전송 | < 1ms |
| WebSocket | 50ms 디바운스 | 50ms + 네트워크 RTT |
| DB 저장 | 비동기 + 실패 무시 (fire-and-forget) | 0ms (송출 차단 없음) |

**설계 원칙:** 자막 출력의 즉시성을 최우선으로 보장한다. 네트워크 전송과 DB 저장은 자막 표시를 차단하지 않는다.

### 12.2 React 렌더링 최적화

| 기법 | 적용 위치 | 효과 |
|------|-----------|------|
| `useMemo` | ControlBar의 JWT decode | 매 렌더마다 base64 디코딩 방지 |
| Zustand selector | 모든 컴포넌트에서 필요한 상태만 구독 | 불필요한 리렌더링 방지 |
| 컴포넌트 분리 | StenographerPanel / StandbyPanel / RemoteOperatorPanel | 역할별 독립 렌더링 |

### 12.3 WebSocket 재연결

```
reconnection: true
reconnectionDelay: 1000 (1초)
reconnectionDelayMax: 10000 (10초)
reconnectionAttempts: Infinity

재연결 성공 시:
  → 기존 세션 Room에 자동 재입장
  → 로컬 IPC는 재연결 중에도 정상 동작 (자막 출력 끊김 없음)
```

### 12.4 상태바 지연시간 모니터링

StatusBar 컴포넌트에서 자막 전송~수신 간 지연시간(ms)을 실시간 표시하여, 속기사가 네트워크 상태를 직관적으로 파악할 수 있다.

### 12.5 캐싱 전략

| 계층 | 대상 | 방식 | TTL |
|------|------|------|-----|
| 클라이언트 메모리 | JWT payload (userId) | useMemo | authToken 변경 시 |
| 클라이언트 메모리 | 온라인 멤버 목록 | Zustand store | 실시간 갱신 |
| 클라이언트 메모리 | 자막 텍스트 (per user) | captionsByUser Map | 세션 종료 시 초기화 |
| 로컬 스토리지 | 인증 토큰 + 유저 정보 | localStorage | 7일 (JWT 만료) |
| 로컬 파일 | 스타일 설정 | user-settings.json | 영구 |
| 서버 메모리 | 세션별 온라인 멤버 | sessionMembers Map | 세션 종료 시 삭제 |

### 12.6 렌더링 최적화
- **Zustand selector 패턴**: 각 컴포넌트가 필요한 상태만 구독하여 불필요한 리렌더 방지
- **useMemo**: JWT decode, 멤버 필터링 등 비용이 높은 연산 캐싱
- **조건부 WebSocket 전송**: 로컬 모드에서는 Socket 코드가 실행되지 않음 (tree-shaking 대상)

---

## 13. 테스트 전략

### 13.1 테스트 인프라

| 도구 | 용도 | 설정 파일 |
|------|------|-----------|
| Vitest | 테스트 러너 (서버 + 클라이언트) | `vitest.config.ts`, `server/vitest.config.ts` |
| Supertest | HTTP API 통합 테스트 | - |
| jsdom | 브라우저 환경 시뮬레이션 | - |
| Testing Library | React 컴포넌트 테스트 | - |

### 13.2 테스트 범위 (총 51개)

**서버 단위 테스트:**

| 파일 | 대상 | 테스트 항목 |
|------|------|-------------|
| `middleware/auth.test.ts` | JWT 인증 | 토큰 생성, 토큰 검증, 만료 토큰 거부, 미들웨어 401 응답 |
| `socket/handlers.test.ts` | 소켓 핸들러 | 세션 입장/퇴장, 자막 브로드캐스트, 교대 요청, 연결 해제 |

**서버 통합 테스트:**

| 파일 | 대상 | 테스트 항목 |
|------|------|-------------|
| `routes/auth.test.ts` | 인증 API | 게스트 로그인, 닉네임 검증, /auth/me 토큰 검증 |
| `routes/session.test.ts` | 세션 API | CRUD, 참가/나가기/종료, 자막 저장/조회, 내보내기(JSON/TXT), 권한 검증 |

**클라이언트 스토어 테스트:**

| 파일 | 대상 | 테스트 항목 |
|------|------|-------------|
| `stores/appStore.test.ts` | appStore | 초기 상태, operator 전환, 자막 텍스트 업데이트, 스타일 변경, 세션/인증 상태 |
| `stores/socketStore.test.ts` | socketStore | 연결 상태, 온라인 멤버 관리, 역할 업데이트, 자막 수신, 상태 리셋 |

### 13.3 테스트 격리

- 서버 테스트는 별도 SQLite 파일(`test.db`)을 사용하여 개발 DB와 격리
- 각 테스트 스위트 전에 DB 초기화
- Zustand 스토어 테스트는 각 테스트마다 스토어 리셋

---

## 14. 에러 핸들링 전략

### 14.1 에러 핸들링 계층 구조

```
+---------------------------------------------+
| Layer 4: UI 에러 표시                         |
| - 사용자 친화적 한국어 메시지                    |
| - 에러 상태별 색상 코딩 (빨강/노랑)              |
| - 자동 복구 안내 (재연결, 재로그인)              |
+---------------------------------------------+
| Layer 3: apiClient 래퍼                       |
| - HTTP 401 -> 자동 로그아웃 + 안내              |
| - HTTP 4xx/5xx -> 에러 메시지 추출              |
| - 네트워크 오류 -> 서버 연결 실패 메시지          |
+---------------------------------------------+
| Layer 2: 라우트/핸들러 레벨 try-catch          |
| - 서버 라우트: 개별 try-catch + 500 응답       |
| - 소켓 핸들러: try-catch + socket.emit('error')|
| - Prisma 에러: 외래키/유니크 제약 처리          |
+---------------------------------------------+
| Layer 1: Express 글로벌 에러 핸들러            |
| - 미처리 예외 캐치                              |
| - 500 응답 + 서버 로그                          |
+---------------------------------------------+
```

### 14.2 서버 에러 핸들링 상세

```
Layer 1: Global Error Handler
  +-- Express app.use((err, req, res, next) => ...)
      +-- 미처리 예외를 500 응답으로 변환

Layer 2: Route-Level try-catch
  +-- 모든 라우트 핸들러를 try-catch로 래핑
      +-- 개별 에러 메시지 + 500 응답

Layer 3: Socket Handler try-catch
  +-- 모든 Socket.io 이벤트 핸들러를 try-catch로 래핑
      +-- socket.emit('error', { message }) 로 클라이언트에 전달

Layer 4: DB 저장 실패 허용
  +-- 자막 로그 DB 저장 실패 시에도 브로드캐스트는 완료
      +-- .catch(() => {}) 패턴
```

### 14.3 클라이언트 에러 핸들링

```
Layer 1: apiClient 공통 처리
  +-- 401 응답 -> 자동 로그아웃 (handleLogout)
  +-- 네트워크 에러 -> 콘솔 로깅

Layer 2: Socket 에러 리스너
  +-- 'error' 이벤트 수신 -> 콘솔 로깅
  +-- 연결 끊김 -> 자동 재연결 (1~10초)
  +-- 재연결 성공 -> 세션 자동 재입장

Layer 3: UI 레벨
  +-- 연결 상태를 StatusBar에 실시간 표시
  +-- 온라인/연결중/재연결중/로컬모드 4가지 상태
```

---

## 15. 디자인 시스템

### 15.1 컬러 토큰 (`tailwind.config.js`)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `surface-0` | `#0f0f1a` | 최하위 배경 (앱 배경) |
| `surface-1` | `#1a1a2e` | 카드/헤더 배경 |
| `surface-2` | `#232340` | 입력 필드/호버 배경 |
| `surface-3` | `#2d2d50` | 활성 상태 배경 |
| `accent` | `#6366f1` | 주 강조색 (인디고) |
| `active-operator` | `#10B981` | 현재 송출자 표시 (에메랄드) |
| `text-primary` | `#f1f5f9` | 주요 텍스트 |
| `text-secondary` | `#94a3b8` | 보조 텍스트 |
| `text-muted` | `#64748b` | 비활성 텍스트 |
| `border-subtle` | `#334155` | 기본 보더 |
| `border-active` | `#6366f1` | 활성 보더 |

### 15.2 애니메이션

| 이름 | 효과 | 용도 |
|------|------|------|
| `fade-in` | 0.2s opacity + translateY | 패널 등장 |
| `slide-in-right` | 0.25s opacity + translateX | 사이드바 슬라이드 |
| `pulse-slow` | 3s pulse | LIVE 표시기 |

### 15.3 타이포그래피

```
기본 폰트 스택: Pretendard → Noto Sans KR → system-ui → sans-serif
자막 프리셋: Noto Sans KR (기본/강연/미니멀), Malgun Gothic (방송/고대비)
```

### 15.4 자막 스타일 프리셋

| 프리셋 | 폰트 크기 | 색상 | 배경 투명도 | 용도 |
|--------|-----------|------|-------------|------|
| 기본 | 48px | 흰색 | 70% | 일반 자막 |
| 방송용 | 56px | 흰색 | 85% | TV/방송 |
| 강연용 | 40px | 노란색 | 60% | 강연/세미나 |
| 고대비 | 52px | 흰색 (파랑 배경) | 90% | 시인성 강화 |
| 미니멀 | 36px | 밝은 회색 | 40% | 최소 간섭 |

---

## 16. 빌드 및 배포

### 16.1 빌드 파이프라인

```
소스 코드
    │
    ├── tsc (TypeScript 컴파일 + 타입 검증)
    │
    ├── Vite Build
    │   ├── renderer → dist/index.html + assets
    │   ├── caption-window → dist/caption.html + assets
    │   └── main + preload → dist-electron/
    │
    └── electron-builder
        └── Windows NSIS Installer → release/
```

### 16.2 electron-builder 설정

| 항목 | 값 |
|------|-----|
| appId | `com.captionstudio.app` |
| productName | `Realtime Caption Studio` |
| target | Windows NSIS |
| asar | true (소스 코드 패키징) |
| oneClick | false (사용자 선택 설치) |
| perMachine | true (모든 사용자용 설치) |
| 바탕화면 바로가기 | 생성 |
| 시작 메뉴 바로가기 | 생성 |

### 16.3 실행 환경

```
개발 환경:
  Electron 앱:  npm run dev (Vite HMR + Electron 핫리로드)
  백엔드 서버:  cd server && npm run dev (tsx watch)

프로덕션 빌드:
  Electron 앱:  npm run build:win
  백엔드 서버:  cd server && npm run build && npm start
```

---

## 부록: 디렉토리 구조 전체

```
2026_hackathon/
├── src/
│   ├── main/
│   │   ├── index.ts              # Electron 진입점, 윈도우/IPC/딥링크 관리
│   │   └── preload.ts            # contextBridge API 정의
│   ├── renderer/
│   │   ├── App.tsx               # 메인 앱 (인증/세션/작업화면 분기)
│   │   ├── components/
│   │   │   ├── LoginPage.tsx     # 로그인 (게스트/카카오)
│   │   │   ├── SessionLobby.tsx  # 세션 로비 (목록/생성/참가)
│   │   │   ├── StenographerPanel.tsx  # 속기사 입력 패널
│   │   │   ├── StandbyPanel.tsx  # 대기 모니터링 + 교대 요청
│   │   │   ├── RemoteOperatorPanel.tsx  # 원격 operator 읽기전용
│   │   │   ├── ControlBar.tsx    # 하단 컨트롤 (자막창/스타일/속기사전환)
│   │   │   ├── StyleSettingsPanel.tsx  # 자막 스타일 설정 사이드바
│   │   │   └── StatusBar.tsx     # 상태바 (연결상태/지연시간)
│   │   ├── stores/
│   │   │   ├── appStore.ts       # 앱 전역 상태 (자막/세션/인증)
│   │   │   ├── appStore.test.ts  # appStore 테스트
│   │   │   ├── socketStore.ts    # WebSocket 상태 (연결/멤버/수신자막)
│   │   │   └── socketStore.test.ts  # socketStore 테스트
│   │   ├── services/
│   │   │   ├── socketService.ts  # Socket.io 클라이언트 래퍼
│   │   │   └── apiClient.ts     # HTTP API 클라이언트 (401 핸들링)
│   │   └── electron.d.ts        # electronAPI 타입 선언
│   ├── caption-window/           # 자막 출력 전용 화면
│   └── shared/
│       └── types.ts              # 공유 타입, IPC 채널 상수, 프리셋
├── server/
│   ├── src/
│   │   ├── index.ts              # Express + Socket.io 서버 진입점
│   │   ├── routes/
│   │   │   ├── auth.ts           # 인증 라우트 (카카오/게스트/me)
│   │   │   ├── auth.test.ts      # 인증 API 테스트
│   │   │   ├── session.ts        # 세션 CRUD + 자막 + 내보내기
│   │   │   ├── session.test.ts   # 세션 API 테스트
│   │   │   └── user.ts           # 유저 라우트
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT 생성/검증/미들웨어
│   │   │   └── auth.test.ts      # JWT 단위 테스트
│   │   ├── socket/
│   │   │   ├── index.ts          # Socket.io 서버 초기화
│   │   │   ├── auth.ts           # Socket handshake 인증
│   │   │   ├── handlers.ts       # 세션/자막/교대 이벤트 핸들러
│   │   │   └── handlers.test.ts  # 소켓 핸들러 테스트
│   │   └── db/
│   │       └── prisma.ts         # Prisma 클라이언트 싱글톤
│   └── prisma/
│       └── schema.prisma         # DB 스키마 정의
├── docs/
│   ├── sprint/                   # Sprint 1~8 진행 기록
│   ├── USER_GUIDE.md             # 사용자 매뉴얼
│   ├── ARCHITECTURE.md           # 본 문서
│   └── FUTURE_ROADMAP.md         # 향후 확장 로드맵
├── tailwind.config.js            # 디자인 시스템 토큰
├── vite.config.ts                # Vite 빌드 설정
├── vitest.config.ts              # 테스트 설정
├── tsconfig.json                 # TypeScript 설정
└── package.json                  # 의존성 + 빌드 스크립트
```
