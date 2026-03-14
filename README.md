# Realtime Caption Studio

> 속기사를 위한 실시간 자막 송출 협업 스튜디오

속기사가 실시간으로 자막을 입력하고, 듀얼 모니터에 전문적인 스타일의 자막을 송출하며, 여러 속기사가 교대 없이 끊김 없는 협업을 할 수 있는 올인원 자막 프로그램입니다.

## 주요 기능

- **다중 속기사 입력**: 최대 4명의 속기사가 독립적으로 자막 입력
- **실시간 송출 전환**: F1~F4 단축키로 즉시 송출 담당자 전환
- **전문 자막 출력**: 듀얼 모니터 투명 오버레이, 자유 크기 조절
- **스타일 커스터마이징**: 폰트/크기/색상/정렬/위치 실시간 조절 + 5가지 프리셋
- **사용자 인증**: 게스트 로그인 (카카오 OAuth 준비 중)

## 기술 스택

| 영역 | 기술 |
|------|------|
| Desktop App | Electron v33 + Vite |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS (커스텀 디자인 시스템) |
| State | Zustand |
| Backend | Express.js + TypeScript |
| Database | Prisma ORM + SQLite |
| Auth | JWT (게스트 / 카카오 OAuth) |

## 프로젝트 구조

```
2026_hackathon/
├── src/
│   ├── main/            # Electron main process
│   ├── renderer/        # React UI (속기사 작업 화면)
│   ├── caption-window/  # 자막 출력 (투명 오버레이)
│   └── shared/          # 공유 타입, 상수
├── server/              # Express 백엔드
│   ├── src/routes/      # API (auth, user, session)
│   ├── src/middleware/   # JWT 인증
│   └── prisma/          # DB 스키마
├── docs/                # 프로젝트 문서
│   ├── PRD.md           # 제품 요구사항
│   └── sprint/          # Sprint별 진행 기록
├── CLAUDE.md            # AI 컨텍스트 (바이브 코딩)
└── ROADMAP.md           # 전체 스프린트 계획
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

1. 앱 실행 후 닉네임을 입력하여 로그인
2. 속기사 입력창에 자막을 입력하고 Enter로 송출
3. F1~F4 또는 상단 버튼으로 송출 담당자 전환
4. 컨트롤 바에서 "자막 창 열기"를 눌러 듀얼 모니터에 자막 출력
5. 스타일 설정 패널에서 자막 디자인 커스터마이징

## 개발 진행 현황

| Sprint | 내용 | 상태 |
|--------|------|------|
| Sprint 1 | 자막 스타일 설정 UI | DONE |
| Sprint 2 | 디자인 리뉴얼 | DONE |
| Sprint 3 | 서버 + 인증 시스템 | DONE |
| Sprint 4 | 세션 관리 + 역할 시스템 | TODO |
| Sprint 5 | WebSocket 실시간 통신 | TODO |
| Sprint 6 | 대기/교대 시스템 | TODO |
| Sprint 7 | 웹 클라이언트 구축 | TODO |
| Sprint 8 | 안정화 + 릴리스 | TODO |

상세 진행 기록은 `docs/sprint/` 참조.

## 개발 방식

이 프로젝트는 **바이브 코딩 (Vibe Coding)** 방식으로 개발되었습니다.

- AI 에이전트가 PM, Frontend, Backend, Designer, QA 등 역할을 분담
- CLAUDE.md로 AI 컨텍스트를 공유하고 일관성 유지
- Sprint 단위로 계획 → 구현 → 문서화 사이클 반복
- `.claude/agents/`에 8개 에이전트 역할 정의
- `.claude/skills/`에 반복 워크플로우 패키징

## 라이선스

MIT
