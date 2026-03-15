# 릴리스 체크리스트

## v0.1.0 릴리스 준비 상태

### 기능 검증
- [x] 게스트 로그인 → JWT 발급 → 세션 로비 진입
- [x] 세션 생성 (이름 + 최대 송출자 수)
- [x] 세션 참가 → role 자동 배정 (operator/standby)
- [x] 자막 입력 → Enter → 자막 창 실시간 출력
- [x] WebSocket 자막 브로드캐스트 (멀티 클라이언트)
- [x] 송출 담당자 전환 (F1~F4 / 교대 요청)
- [x] Operator 이탈 시 Standby 자동 승격
- [x] 자막 스타일 실시간 변경 (5개 프리셋 포함)
- [x] 세션 내보내기 (TXT / JSON)
- [x] 세션 종료 → 전체 클라이언트 알림

### 코드 품질
- [x] TypeScript strict mode — `tsc --noEmit` 에러 0건
- [x] 서버 테스트 33개 통과 (단위 + 통합)
- [x] 클라이언트 테스트 18개 통과 (스토어 + 컴포넌트)
- [x] 서버 모든 라우트 try-catch 에러 핸들링
- [x] 소켓 핸들러 try-catch + error 이벤트 발행
- [x] 글로벌 Express 에러 핸들러
- [x] 클라이언트 apiClient 401 자동 로그아웃

### 빌드
- [x] `npm run build:vite` — Vite 빌드 성공
- [x] `build/icon.ico` 존재
- [x] `server/.env.example` 작성 완료
- [ ] `npm run build:win` — NSIS 인스톨러 생성 (수동 확인 필요)

### CI/CD
- [x] GitHub Actions CI 워크플로우 (ci.yml)
  - Client job: TypeScript 체크 + 18 테스트 + Vite 빌드
  - Server job: Prisma 생성 + TypeScript 체크 + 33 테스트
  - Build job: Windows Electron 빌드 + 아티팩트 업로드
- [x] GitHub Actions Release 워크플로우 (release.yml)
  - v* 태그 시 자동 트리거
  - 테스트 검증 → Windows 빌드 → GitHub Releases 배포

### 문서
- [x] README.md — 프로젝트 소개, 설치법, 사용법
- [x] CLAUDE.md — AI 컨텍스트 파일
- [x] ROADMAP.md — 전체 Sprint 계획 + 완료 상태
- [x] docs/PRD.md — 제품 요구사항 정의서
- [x] docs/ARCHITECTURE.md — 시스템 아키텍처
- [x] docs/USER_GUIDE.md — 사용자 매뉴얼
- [x] docs/FUTURE_ROADMAP.md — 향후 확장 로드맵
- [x] docs/sprint/sprint1~8.md — Sprint별 진행 기록

### 알려진 제한사항
| 항목 | 상태 | 대안 |
|------|------|------|
| 카카오 OAuth | SSL 이슈로 보류 | 게스트 로그인으로 대체 |
| 웹 클라이언트 | Phase 2로 연기 | Electron 앱으로 제공 |
| 커스텀 폰트 | 미구현 | 시스템 폰트 10종 제공 |
| E2E 테스트 | 미구현 | 단위/통합 51개로 커버 |
| macOS/Linux | 미테스트 | Windows 10+ 지원 |

### 배포 후 모니터링 계획
- 서버 헬스체크: GET /health 엔드포인트
- 클라이언트 에러: apiClient에서 에러 로깅
- WebSocket 상태: 연결/재연결/끊김 StatusBar 표시
- 자막 지연: StatusBar 지연시간(ms) 모니터링 (200ms 초과 시 경고)
