# Realtime Caption Studio — Roadmap & Sprint Plan

---

## 전체 로드맵 (Phase Overview)

```
Phase 1 (Sprint 1~2)  ─  MVP 고도화: 디자인 + 자막 설정
Phase 2 (Sprint 3~4)  ─  백엔드 구축: 인증 + 사용자 관리
Phase 3 (Sprint 5~6)  ─  실시간 협업: 다중 속기사 세션
Phase 4 (Sprint 7~8)  ─  웹 전환: 브라우저 기반 서비스
```

---

## Phase 1 — MVP 고도화

### Sprint 1: 자막 스타일 설정 UI (1주)

**목표**: 속기사가 자막의 시각적 스타일을 실시간으로 조정할 수 있도록 한다.

| # | 태스크 | 상세 | 담당 에이전트 |
|---|--------|------|---------------|
| 1.1 | 스타일 설정 패널 UI | 사이드바 또는 모달로 스타일 설정 패널 구현 | `frontend` |
| 1.2 | 폰트 선택기 | 시스템 폰트 목록 드롭다운, 한글 폰트 우선 표시 | `frontend` |
| 1.3 | 글자 크기 슬라이더 | 24px ~ 96px 범위, 실시간 미리보기 | `frontend` |
| 1.4 | 글자색 / 배경색 피커 | 컬러 피커 + 배경 투명도(opacity) 슬라이더 | `frontend` |
| 1.5 | 텍스트 정렬 / 위치 | 좌/중/우 정렬, 상/중/하 위치 토글 | `frontend` |
| 1.6 | 줄 간격 / 자간 조절 | 줄 간격 1.0~2.0, 자간 -2px~5px | `frontend` |
| 1.7 | 설정 저장/불러오기 | user-settings.json에 자동 저장, 앱 재시작 시 복원 | `backend` |
| 1.8 | 프리셋 기능 | 기본/방송용/강연용 등 스타일 프리셋 3~5개 제공 | `frontend` `designer` |

**완료 기준**:
- [ ] 설정 변경 시 자막 창에 실시간 반영
- [ ] 앱 종료 후 재시작해도 설정 유지
- [ ] 프리셋으로 한 번에 스타일 변경 가능

---

### Sprint 2: 디자인 리뉴얼 (1주)

**목표**: 전문적이고 세련된 UI/UX로 전면 개선한다.

| # | 태스크 | 상세 | 담당 에이전트 |
|---|--------|------|---------------|
| 2.1 | 디자인 시스템 구축 | 색상 팔레트, 타이포그래피, 간격, 그림자 등 디자인 토큰 정리 | `designer` |
| 2.2 | 다크/라이트 테마 | 다크 기본, 라이트 옵션 제공 | `designer` `frontend` |
| 2.3 | 속기사 작업 화면 리디자인 | 입력창 비율, 여백, 색상, 아이콘 전면 수정 | `designer` `frontend` |
| 2.4 | 송출 전환 버튼 개선 | 현재 송출자 시각적 강조 (애니메이션, 글로우 효과) | `designer` `frontend` |
| 2.5 | 상태바 추가 | 하단에 현재 송출자, 연결 상태, 세션 시간 표시 | `frontend` |
| 2.6 | 자막 창 디자인 | 자막 등장/퇴장 애니메이션 (fade, slide-up) | `frontend` |
| 2.7 | 아이콘/로고 제작 | 앱 아이콘, 트레이 아이콘, 스플래시 화면 | `designer` |
| 2.8 | 반응형 레이아웃 | 창 크기 변경 시 레이아웃 유연하게 대응 | `frontend` |

**완료 기준**:
- [ ] 디자인 시스템 문서화 완료
- [ ] 전체 화면 스크린샷 기준 일관된 비주얼
- [ ] 자막 애니메이션 자연스럽게 동작

---

## Phase 2 — 백엔드 구축

### Sprint 3: 서버 기반 + 인증 시스템 (1.5주)

**목표**: 서버를 구축하고, 사용자 인증/관리의 기반을 만든다.

| # | 태스크 | 상세 | 담당 에이전트 |
|---|--------|------|---------------|
| 3.1 | 서버 프로젝트 초기화 | Node.js + Express + TypeScript 서버 셋업 | `server` |
| 3.2 | 데이터베이스 설계 | User, Session, CaptionLog 테이블 ERD 설계 | `data` |
| 3.3 | DB 연동 | PostgreSQL 또는 SQLite(MVP), Prisma ORM 셋업 | `data` `server` |
| 3.4 | 회원가입 API | POST /auth/register (이메일+비밀번호, bcrypt 해싱) | `server` |
| 3.5 | 로그인 API | POST /auth/login → JWT 발급 | `server` |
| 3.6 | 로그인 화면 UI | Electron 앱에 로그인/회원가입 화면 추가 | `frontend` |
| 3.7 | 인증 미들웨어 | JWT 검증 미들웨어, 토큰 갱신 로직 | `server` |
| 3.8 | 유저 프로필 API | GET/PUT /users/me (이름, 역할, 프로필 설정) | `server` |

**데이터 모델 (초안)**:
```
User {
  id: UUID
  email: string (unique)
  password: string (hashed)
  name: string
  role: 'stenographer' | 'admin'
  createdAt: timestamp
}

Session {
  id: UUID
  name: string
  createdBy: User.id
  status: 'active' | 'ended'
  maxOperators: number (default: 2)
  createdAt: timestamp
}

SessionMember {
  sessionId: Session.id
  userId: User.id
  role: 'operator' | 'standby'
  joinedAt: timestamp
}
```

**완료 기준**:
- [ ] 회원가입 → 로그인 → 토큰 발급 플로우 동작
- [ ] 로그인하지 않으면 앱 사용 불가
- [ ] 유저 정보 조회/수정 가능

---

### Sprint 4: 세션 관리 + 역할 시스템 (1.5주)

**목표**: 세션(작업 공간) 개념을 도입하고, 속기사별 역할을 관리한다.

| # | 태스크 | 상세 | 담당 에이전트 |
|---|--------|------|---------------|
| 4.1 | 세션 CRUD API | 세션 생성, 조회, 종료 API | `server` |
| 4.2 | 세션 참가 API | POST /sessions/:id/join → 역할 자동 배정 | `server` |
| 4.3 | 세션 로비 화면 | 세션 목록, 새 세션 생성, 참가 UI | `frontend` |
| 4.4 | 역할 배정 로직 | 참가 순서대로 operator(최대 2) → standby 자동 배정 | `server` `planner` |
| 4.5 | 세션 설정 화면 | 최대 송출자 수, 세션 이름 설정 | `frontend` |
| 4.6 | 세션 로그 저장 | 자막 이력을 서버 DB에 저장 | `data` |
| 4.7 | 세션 종료 및 리포트 | 세션 종료 시 자막 로그 다운로드 (TXT/JSON) | `data` `frontend` |

**완료 기준**:
- [ ] 세션 생성 → 참가 → 작업 → 종료 플로우 완성
- [ ] 2명 초과 시 standby로 자동 배정
- [ ] 세션 종료 후 자막 기록 다운로드 가능

---

## Phase 3 — 실시간 협업

### Sprint 5: WebSocket 실시간 통신 (1.5주)

**목표**: 여러 PC의 속기사가 실시간으로 같은 세션에서 협업한다.

| # | 태스크 | 상세 | 담당 에이전트 |
|---|--------|------|---------------|
| 5.1 | Socket.io 서버 구축 | 세션별 room 기반 실시간 통신 | `server` |
| 5.2 | Electron IPC → WebSocket 전환 | CaptionTransport 추상화 레이어 도입 | `backend` `planner` |
| 5.3 | 실시간 자막 동기화 | operator의 Enter → 모든 클라이언트에 자막 브로드캐스트 | `server` `frontend` |
| 5.4 | 실시간 송출 전환 | 전환 이벤트를 모든 클라이언트에 실시간 전파 | `server` |
| 5.5 | 접속자 목록 실시간 표시 | 현재 세션에 누가 접속 중인지 실시간 UI | `frontend` |
| 5.6 | 연결 상태 처리 | 연결 끊김 감지, 자동 재연결, 상태 표시 | `frontend` `server` |

**완료 기준**:
- [ ] 2대 PC에서 같은 세션 접속 확인
- [ ] A가 입력한 자막이 B 화면에도 실시간 표시
- [ ] 네트워크 끊김 시 자동 재연결

---

### Sprint 6: 대기 영역 + 교대 시스템 (1주)

**목표**: 3명 이상의 속기사 협업 시 대기-교대 시스템을 구현한다.

| # | 태스크 | 상세 | 담당 에이전트 |
|---|--------|------|---------------|
| 6.1 | 대기 영역 UI | standby 속기사 전용 화면: 현재 자막 모니터링 + 연습 입력 | `frontend` `designer` |
| 6.2 | 교대 요청 시스템 | standby → operator 교대 요청 버튼 + 승인 플로우 | `frontend` `server` |
| 6.3 | 자동 교대 타이머 | 설정된 시간(ex. 15분) 후 자동 교대 알림 | `frontend` `server` |
| 6.4 | 속기사 수 기반 UI 변경 | 1명: 단독 / 2명: 병렬 입력 / 3+명: operator + standby 분리 | `frontend` |
| 6.5 | 실시간 자막 미리보기 (standby) | standby가 현재 operator의 자막을 실시간으로 볼 수 있도록 | `frontend` |
| 6.6 | 교대 이력 로깅 | 누가 언제 교대했는지 기록 | `data` |

**UI 구조 (3명 이상)**:
```
┌──────────────────────────────────────┐
│  [운영 영역]                          │
│  ┌──────────┐  ┌──────────┐          │
│  │ Operator A│  │ Operator B│         │
│  │ (송출중)   │  │ (대기송출) │         │
│  └──────────┘  └──────────┘          │
│                                      │
│  [대기 영역]                          │
│  ┌──────────────────────────┐        │
│  │ 속기사 C (standby)        │        │
│  │ 📺 현재 자막 모니터링      │        │
│  │ [교대 요청]               │        │
│  └──────────────────────────┘        │
└──────────────────────────────────────┘
```

**완료 기준**:
- [ ] 3명 접속 시 자동으로 1명은 standby
- [ ] standby에서 교대 요청 → operator 승인 → 즉시 교대
- [ ] 교대 시 자막 끊김 없음

---

## Phase 4 — 웹 전환

### Sprint 7: 웹 클라이언트 구축 (2주)

**목표**: Electron 없이 브라우저에서 동일 기능을 사용할 수 있도록 한다.

| # | 태스크 | 상세 | 담당 에이전트 |
|---|--------|------|---------------|
| 7.1 | 웹 프론트엔드 프로젝트 셋업 | React + Vite (Electron 제거), 동일 컴포넌트 재사용 | `frontend` `planner` |
| 7.2 | 자막 출력 웹 페이지 | /caption/:sessionId 경로로 자막만 표시하는 페이지 | `frontend` |
| 7.3 | Electron 전용 코드 분리 | IPC → WebSocket 전환, preload 제거, 조건부 import | `backend` `planner` |
| 7.4 | 자막 출력 URL 공유 | 세션별 자막 URL 생성 → 누구나 브라우저에서 자막 시청 | `server` `frontend` |
| 7.5 | OBS 브라우저 소스 호환 | OBS에서 브라우저 소스로 자막 URL 추가 가능 | `frontend` |
| 7.6 | 반응형 웹 디자인 | 모바일/태블릿 대응 (속기사 화면은 데스크탑 전용) | `frontend` `designer` |
| 7.7 | 배포 파이프라인 | Vercel/AWS 배포, CI/CD 구성 | `server` |

**완료 기준**:
- [ ] 브라우저에서 로그인 → 세션 참가 → 자막 입력 가능
- [ ] 자막 출력 URL을 OBS 브라우저 소스에 추가하면 자막 표시
- [ ] Electron 앱과 웹 앱이 같은 세션에 혼합 접속 가능

---

### Sprint 8: 안정화 + 릴리스 (1주)

| # | 태스크 | 상세 | 담당 에이전트 |
|---|--------|------|---------------|
| 8.1 | E2E 테스트 작성 | 전체 플로우 자동화 테스트 | `qa` |
| 8.2 | 성능 최적화 | 자막 지연 측정 + 병목 제거 | `backend` `server` |
| 8.3 | 에러 핸들링 강화 | 네트워크 오류, 세션 만료 등 엣지 케이스 처리 | `qa` `frontend` |
| 8.4 | 사용자 가이드 | 속기사용 사용 설명서 작성 | `pm` |
| 8.5 | 빌드 및 배포 | Electron 인스톨러 + 웹 배포 | `server` |

---

## Sprint 타임라인 요약

```
Sprint 1  ████░░░░░░░░  자막 스타일 설정     (1주)
Sprint 2  ░░██████░░░░  디자인 리뉴얼        (1주)
Sprint 3  ░░░░████████  서버 + 인증           (1.5주)
Sprint 4  ░░░░░░██████  세션 관리             (1.5주)
Sprint 5  ░░░░░░░░████  WebSocket 실시간      (1.5주)
Sprint 6  ░░░░░░░░░░██  대기/교대 시스템      (1주)
Sprint 7  ░░░░░░░░░░░░████  웹 전환           (2주)
Sprint 8  ░░░░░░░░░░░░░░██  안정화/릴리스     (1주)
                                     총 약 11주
```

---

## 각 Sprint 시작 시 체크리스트

1. PM 에이전트: 해당 Sprint 사용자 스토리 확인
2. Planner 에이전트: 기술 설계 + 태스크 분해
3. Designer 에이전트: UI/UX 시안 (디자인 관련 Sprint)
4. Frontend/Backend/Server: 구현
5. QA 에이전트: 테스트 케이스 작성 + 검증
6. 완료 기준 전체 체크 후 다음 Sprint 진행
