# Realtime Caption Studio

## 프로젝트 개요
- **서비스명**: Realtime Caption Studio
- **목적**: 속기사 실시간 자막 송출 프로그램 (2명 이상 협업, 듀얼 모니터 자막 출력)
- **개발 방식**: 바이브 코딩 (AI 네이티브 해커톤)
- **현재 Sprint**: Sprint 8 완료 (안정화 + 릴리스) — `docs/sprint/sprint8.md` 참조

## 기술 스택
- **Runtime**: Electron v33+ (데스크탑 앱)
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (커스텀 디자인 시스템)
- **State**: Zustand
- **Backend**: Express.js + TypeScript (server/ 디렉토리)
- **ORM/DB**: Prisma + SQLite (개발), PostgreSQL (프로덕션 예정)
- **Auth**: JWT (게스트 로그인, 카카오 OAuth 준비 중)
- **Build**: Vite + electron-builder
- **IPC**: Electron contextBridge (nodeIntegration: false, contextIsolation: true)

## 아키텍처

```
2026_hackathon/
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.ts        # 앱 진입점, 윈도우 관리, IPC, 딥링크
│   │   └── preload.ts      # contextBridge API 노출
│   ├── renderer/           # React 앱 (속기사 작업 화면)
│   │   ├── App.tsx         # 메인 앱 + 인증 상태 관리
│   │   ├── components/     # UI 컴포넌트
│   │   ├── stores/         # Zustand stores
│   │   └── electron.d.ts   # electronAPI 타입 선언
│   ├── caption-window/     # 자막 출력 화면 (별도 윈도우)
│   └── shared/             # 공유 타입, 상수 (types.ts)
├── server/                 # Express 백엔드 서버
│   ├── src/
│   │   ├── index.ts        # 서버 진입점 (port 3000)
│   │   ├── routes/         # API 라우트 (auth, user, session)
│   │   ├── middleware/      # JWT 인증 미들웨어
│   │   └── db/             # Prisma 클라이언트
│   └── prisma/             # DB 스키마 + 마이그레이션
├── docs/                   # 프로젝트 문서
│   └── sprint/             # Sprint별 진행 기록
└── .claude/                # 바이브 코딩 설정
    ├── agents/             # AI 에이전트 역할 정의
    └── skills/             # 반복 워크플로우 패키징
```

## 핵심 도메인 개념
- **Operator**: 현재 자막 송출 담당 속기사
- **Stenographer**: 속기사 (A, B, ... 최대 4명)
- **Caption**: 자막 텍스트 + 스타일 메타데이터
- **CaptionWindow**: 별도 모니터에 출력되는 투명 오버레이 자막 창
- **Session**: 속기사들이 협업하는 작업 공간 (Sprint 4~)

## 코드 규칙
- TypeScript strict mode 사용
- 컴포넌트: PascalCase (예: `CaptionDisplay.tsx`)
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- IPC 채널명: `kebab-case` (예: `caption:update`)
- 커밋: `feat:`, `fix:`, `style:`, `refactor:`, `test:`, `chore:` 접두사 사용
- Electron main process는 CJS 빌드 (ESM 사용 금지, `"type": "module"` 절대 추가 금지)

## 절대 하지 말 것
- `any` 타입 남발 금지 (명시적 타입 우선)
- TODO 없이 미완성 코드 커밋 금지
- Electron main process에서 ESM 문법 사용 금지 (`__dirname` 등 CJS API 필수)
- `nodeIntegration: true` 설정 금지 (보안)
- `.env` 파일 커밋 금지

## 주요 IPC 채널
| 채널 | 방향 | 설명 |
|------|------|------|
| `caption:update` | renderer → main → caption-window | 자막 텍스트 업데이트 |
| `operator:switch` | renderer → main | 송출 담당자 전환 |
| `style:update` | renderer → main → caption-window | 자막 스타일 변경 |
| `window:caption-open` | renderer → main | 자막 창 열기 |
| `window:caption-close` | renderer → main | 자막 창 닫기 |
| `caption-window:closed` | main → renderer | 자막 창 닫힘 알림 (상태 동기화) |
| `auth:callback` | main → renderer | OAuth 딥링크 토큰 전달 |

## 개발 환경 실행
```bash
# Electron 앱 (루트 디렉토리)
npm run dev

# 서버 (server/ 디렉토리)
cd server
NODE_OPTIONS="--use-system-ca" npm run dev
```

## 컨텍스트 참조
- **현재 Sprint**: `docs/sprint/` 최신 파일
- **전체 로드맵**: `ROADMAP.md`
- **새 세션 시작 시**: 반드시 `docs/sprint/` 최신 파일과 이 문서를 먼저 읽을 것
- **디자인 토큰**: `tailwind.config.js` 참조
- **DB 스키마**: `server/prisma/schema.prisma` 참조

## 알려진 이슈 & 향후 작업
- 카카오 OAuth: SSL 인증서 문제로 보류 중 (게스트 로그인으로 대체)
- 카카오 개발자 콘솔: Redirect URI는 REST API 키 설정 내에서 등록 (2026년 기준 UI 변경됨)
- 커스텀 폰트 업로드: Sprint 1 고도화 시 추가 예정
- 네이버 OAuth: 추후 추가 예정
- WebSocket 기반 실시간 통신: Sprint 5에서 구현 완료
- 세션 협업 + 교대 시스템: Sprint 6에서 구현 완료
- 테스트 51개 + 에러 핸들링: Sprint 8에서 구현 완료
