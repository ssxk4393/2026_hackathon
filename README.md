# Realtime Caption Studio

> 속기사를 위한 실시간 자막 송출 협업 스튜디오

속기사가 실시간으로 자막을 입력하고, 듀얼 모니터에 전문적인 스타일의 자막을 송출하며, 여러 속기사가 WebSocket 기반으로 끊김 없이 협업할 수 있는 데스크탑 자막 프로그램입니다. 세션 기반 역할 배정, 대기/교대 시스템, 실시간 동기화를 통해 속기 현장의 실제 워크플로우를 지원합니다.

## 주요 기능

- **다중 속기사 입력**: 최대 4명의 속기사가 세션에서 독립적으로 자막 입력
- **실시간 송출 전환**: F1~F4 단축키로 즉시 송출 담당자 전환
- **전문 자막 출력**: 듀얼 모니터 투명 오버레이, 자유 크기 조절
- **스타일 커스터마이징**: 폰트/크기/색상/정렬/위치 실시간 조절 + 5가지 프리셋
- **세션 기반 협업**: 세션 생성/참가, 역할 자동 배정 (operator/standby)
- **WebSocket 실시간 통신**: Socket.io 기반 자막/전환/접속 상태 실시간 동기화
- **대기/교대 시스템**: standby 속기사 모니터링, 교대 요청/승인, 역할 순환
- **사용자 인증**: 게스트 로그인 + JWT 인증 (카카오 OAuth 준비 완료)

## 기술 스택

| 영역 | 기술 |
|------|------|
| Desktop App | Electron v33 + Vite |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS (커스텀 디자인 시스템) |
| State | Zustand |
| Backend | Express.js + TypeScript |
| Realtime | Socket.io (WebSocket) |
| Database | Prisma ORM + SQLite |
| Auth | JWT (게스트 / 카카오 OAuth) |
| Test | Vitest + Testing Library |
| Build | Vite + electron-builder |

## 프로젝트 구조

```
2026_hackathon/
├── src/
│   ├── main/               # Electron main process
│   ├── renderer/           # React UI (속기사 작업 화면)
│   │   ├── components/     # UI 컴포넌트
│   │   └── stores/         # Zustand 상태 관리
│   ├── caption-window/     # 자막 출력 (투명 오버레이)
│   └── shared/             # 공유 타입, 상수
├── server/                 # Express 백엔드
│   ├── src/
│   │   ├── routes/         # API (auth, user, session)
│   │   ├── middleware/     # JWT 인증
│   │   └── socket/         # Socket.io 실시간 통신
│   └── prisma/             # DB 스키마 + 마이그레이션
├── docs/                   # 프로젝트 문서
│   ├── PRD.md              # 제품 요구사항
│   └── sprint/             # Sprint별 진행 기록
├── .claude/                # 바이브 코딩 설정
│   ├── agents/             # 8개 AI 에이전트 역할 정의
│   └── skills/             # 반복 워크플로우 패키징
├── CLAUDE.md               # AI 컨텍스트 (바이브 코딩)
└── ROADMAP.md              # 전체 스프린트 계획
```

## 시작하기

### 사전 요구사항

- Node.js 20+
- npm 10+

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install
cd server && npm install

# 2. DB 마이그레이션
cd server
npx prisma migrate deploy

# 3. 서버 실행 (터미널 1)
cd server
NODE_OPTIONS="--use-system-ca" npm run dev

# 4. Electron 앱 실행 (터미널 2, 루트 디렉토리)
npm run dev
```

### 환경 변수 설정

```bash
# server/.env
PORT=3000
JWT_SECRET=your-secret-key
KAKAO_REST_API_KEY=your-kakao-key        # 선택
KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback  # 선택
DATABASE_URL="file:./dev.db"
```

## 사용법

1. 앱 실행 후 닉네임을 입력하여 게스트 로그인
2. 세션을 생성하거나 기존 세션에 참가
3. 속기사 입력창에 자막을 입력하고 Enter로 송출
4. F1~F4 또는 상단 버튼으로 송출 담당자 전환
5. 컨트롤 바에서 "자막 창 열기"를 눌러 듀얼 모니터에 자막 출력
6. 스타일 설정 패널에서 자막 디자인 커스터마이징
7. 3명 이상 접속 시 대기/교대 시스템 자동 활성화

## 핵심 기능 데모

### 실시간 자막 입력 및 송출
속기사가 입력창에 텍스트를 타이핑하고 Enter를 누르면, 자막이 즉시 별도 모니터의 투명 오버레이 창에 표시됩니다. 폰트, 크기, 색상, 정렬, 배경 투명도 등을 실시간으로 조절할 수 있으며, 5가지 프리셋(기본/방송용/강연용 등)으로 빠르게 스타일을 전환할 수 있습니다.

### 다중 속기사 협업 (WebSocket)
여러 속기사가 동일 세션에 접속하면 Socket.io를 통해 자막, 송출 전환, 접속 상태가 모든 클라이언트에 실시간으로 동기화됩니다. 세션 참가 시 역할(operator/standby)이 자동으로 배정되어 별도 설정 없이 바로 협업이 가능합니다.

### 대기/교대 시스템
3명 이상의 속기사가 접속하면, operator(송출 담당)와 standby(대기)로 역할이 자동 분리됩니다. standby 속기사는 현재 자막을 실시간으로 모니터링하면서 교대 요청을 보낼 수 있고, operator가 승인하면 즉시 역할이 전환됩니다.

### 송출 담당자 전환
F1~F4 단축키 또는 UI 버튼으로 현재 송출 담당자를 즉시 전환할 수 있습니다. 전환 시 모든 연결된 클라이언트에 실시간으로 반영되어 자막 끊김이 발생하지 않습니다.

## 개발 진행 현황

| Sprint | 내용 | 상태 |
|--------|------|------|
| Sprint 1 | 자막 스타일 설정 UI | DONE |
| Sprint 2 | 디자인 리뉴얼 (다크 테마, 디자인 시스템) | DONE |
| Sprint 3 | 서버 + 인증 시스템 (게스트 로그인, JWT) | DONE |
| Sprint 4 | 세션 관리 + 역할 시스템 | DONE |
| Sprint 5 | WebSocket 실시간 통신 (Socket.io) | DONE |
| Sprint 6 | 대기/교대 시스템 | DONE |
| Sprint 7 | 웹 클라이언트 구축 | SKIPPED (Phase 2 예정) |
| Sprint 8 | 안정화 + 릴리스 (테스트, 에러 핸들링, 빌드) | DONE |

상세 진행 기록은 `docs/sprint/` 참조.

## 테스트

프로젝트는 Vitest 기반의 단위/통합 테스트를 포함하고 있습니다. 총 **51개 테스트**가 작성되어 있습니다.

```bash
# 클라이언트 테스트 (18개)
npm test

# 서버 테스트 (33개)
cd server && npm test

# 전체 테스트 실행
npm test && cd server && npm test
```

| 영역 | 테스트 수 | 범위 |
|------|-----------|------|
| Client | 18 | 컴포넌트, 스토어, 유틸리티 |
| Server | 33 | API 라우트, 미들웨어, WebSocket, 세션 관리 |
| **합계** | **51** | |

## CI/CD

GitHub Actions를 통해 자동화된 빌드/테스트/배포 파이프라인이 구축되어 있습니다.

### CI 파이프라인 (`ci.yml`)

PR 생성 및 master push 시 자동 실행됩니다.

| Job | 환경 | 실행 내용 |
|-----|------|-----------|
| **Client** | ubuntu-latest | TypeScript 타입 체크 → 18개 테스트 → Vite 빌드 |
| **Server** | ubuntu-latest | Prisma 생성 → DB 마이그레이션 → TypeScript 체크 → 33개 테스트 |
| **Build** | windows-latest | Electron 빌드 → NSIS 인스톨러 생성 → 아티팩트 업로드 (7일 보관) |

### Release 파이프라인 (`release.yml`)

`v*` 태그 push 시 자동 실행됩니다.

1. **Pre-release Tests**: 클라이언트 + 서버 전체 테스트 검증
2. **Build & Publish**: Windows Electron 빌드 → GitHub Releases 자동 배포

### 워크플로우 구성

```yaml
# ci.yml 핵심 구조
jobs:
  client:    # TypeScript + 18 tests + Vite build
  server:    # Prisma + TypeScript + 33 tests
  build:     # Electron NSIS installer (depends on client, server)
    needs: [client, server]
```

## 바이브 코딩 방법론

이 프로젝트는 **바이브 코딩 (Vibe Coding)** 방식으로 개발되었습니다. 바이브 코딩은 AI를 단순한 코드 생성 도구가 아닌, 프로젝트의 전 과정에 참여하는 협업 파트너로 활용하는 AI 네이티브 개발 방법론입니다.

### AI 에이전트 시스템

8개의 전문 AI 에이전트가 각자의 역할을 분담하여 소프트웨어 개발 팀을 시뮬레이션합니다.

| 에이전트 | 역할 | 주요 책임 |
|----------|------|-----------|
| `pm` | Product Manager | 요구사항 정의, 우선순위, 사용자 스토리 |
| `planner` | Technical Planner | 아키텍처 설계, 태스크 분해, 기술 의사결정 |
| `designer` | UI/UX Designer | 디자인 시스템, 컴포넌트 시안, 접근성 |
| `frontend` | Frontend Developer | React 컴포넌트, 상태 관리, UI 구현 |
| `backend` | Backend Developer | Electron IPC, 메인 프로세스 로직 |
| `server` | Server Developer | Express API, WebSocket, 인증 |
| `data` | Data Engineer | DB 스키마, Prisma ORM, 데이터 모델링 |
| `qa` | QA Engineer | 테스트 작성, 버그 검증, 성능 측정 |

### 컨텍스트 관리 체계

- **CLAUDE.md**: 프로젝트 전체 컨텍스트를 AI가 이해할 수 있는 형태로 구조화
- **Sprint 문서**: 각 Sprint의 목표, 태스크, 완료 기준을 문서화하여 AI의 작업 범위를 명확히 제한
- **에이전트 정의서**: `.claude/agents/`에 각 에이전트의 책임, 규칙, 산출물 형식을 정의
- **스킬 패키징**: `.claude/skills/`에 반복되는 워크플로우(Sprint 시작, 코드 리뷰 등)를 패키징

### 개발 사이클

각 Sprint는 다음 사이클을 따릅니다:

1. **계획**: PM 에이전트가 사용자 스토리 정의 → Planner 에이전트가 기술 설계 및 태스크 분해
2. **구현**: Frontend/Backend/Server 에이전트가 각 태스크 구현
3. **검증**: QA 에이전트가 테스트 작성 및 검증
4. **문서화**: Sprint 결과를 문서로 기록하고 CLAUDE.md 업데이트

이 방식을 통해 8개 Sprint를 체계적으로 진행하며, 일관된 코드 품질과 문서화를 유지할 수 있었습니다.

## 향후 계획

Sprint 7(웹 클라이언트)을 포함한 향후 확장 계획은 `FUTURE_ROADMAP.md`에 정리되어 있습니다. 주요 방향:

- 웹 클라이언트 구축 (브라우저 기반 접속, OBS 브라우저 소스 호환)
- 카카오/네이버 OAuth 소셜 로그인
- 커스텀 폰트 업로드
- PostgreSQL 마이그레이션 (프로덕션 환경)
- 클라우드 배포 및 CI/CD 파이프라인

## 라이선스

MIT
