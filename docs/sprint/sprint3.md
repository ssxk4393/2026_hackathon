# Sprint 3: 서버 기반 + 인증 시스템

**기간**: 2026-03-15 ~ (진행 중)
**상태**: COMPLETED

---

## 목표
서버를 구축하고, 사용자 인증/관리의 기반을 만든다.

## 태스크 현황

| # | 태스크 | 상태 | 비고 |
|---|--------|------|------|
| 3.1 | 서버 프로젝트 초기화 (Express + TS) | DONE | server/ 디렉토리 |
| 3.2 | 데이터베이스 설계 (User, Session, SessionMember, CaptionLog) | DONE | Prisma schema |
| 3.3 | DB 연동 (SQLite + Prisma ORM) | DONE | dev.db 생성 완료 |
| 3.4 | 카카오 OAuth API | BLOCKED | SSL 인증서 문제 (추후 해결) |
| 3.5 | 게스트 로그인 API (닉네임 → JWT) | DONE | POST /auth/guest |
| 3.6 | 로그인 화면 UI (Electron) | DONE | LoginPage.tsx |
| 3.7 | 인증 미들웨어 (JWT 검증) | DONE | auth.ts middleware |
| 3.8 | 유저 프로필 API (GET/PUT /users/me) | DONE | user.ts routes |

## 주요 구현 파일

### 서버 (server/)
- `server/src/index.ts` — Express 서버 진입점 (port 3000, CORS)
- `server/src/routes/auth.ts` — 인증 API (카카오 OAuth + 게스트 로그인)
- `server/src/routes/user.ts` — 유저 프로필 CRUD
- `server/src/routes/session.ts` — 세션 CRUD (Sprint 4 선행 작업)
- `server/src/middleware/auth.ts` — JWT 생성/검증 + authMiddleware
- `server/prisma/schema.prisma` — DB 스키마 (User, Session, SessionMember, CaptionLog)

### Electron (src/)
- `src/renderer/components/LoginPage.tsx` — 게스트 로그인 UI (닉네임 입력)
- `src/renderer/App.tsx` — 인증 상태 관리 (localStorage), 조건부 렌더링
- `src/main/index.ts` — 커스텀 프로토콜 (caption-studio://) 등록, 딥링크 핸들러
- `src/main/preload.ts` — openExternal, onAuthCallback API 추가
- `src/renderer/electron.d.ts` — 타입 선언 업데이트

## 데이터 모델 (Prisma)

```prisma
model User {
  id         String   @id @default(uuid())
  provider   String   // 'kakao' | 'naver' | 'email' | 'guest'
  providerId String
  email      String?
  name       String
  avatar     String?
  @@unique([provider, providerId])
}

model Session {
  id           String   @id @default(uuid())
  name         String
  createdBy    String
  status       String   @default("active")  // 'active' | 'ended'
  maxOperators Int      @default(2)
}

model SessionMember {
  id        String @id @default(uuid())
  sessionId String
  userId    String
  role      String @default("standby")  // 'operator' | 'standby'
}

model CaptionLog {
  id        String @id @default(uuid())
  sessionId String
  userId    String
  text      String
}
```

## 기술 결정사항

- **카카오 OAuth 보류**: 사내 네트워크 SSL 인증서 문제로 카카오 API 호출 실패. 게스트 로그인으로 대체, 추후 환경 해결 후 재시도
- **게스트 로그인 도입**: 닉네임만 입력하면 JWT 발급. 해커톤 MVP에 적합
- **커스텀 프로토콜**: `caption-studio://` 등록하여 OAuth 콜백 → Electron 딥링크 구조 준비 완료 (카카오 연동 시 바로 사용 가능)
- **인증 플로우**: LoginPage → POST /auth/guest → JWT 발급 → localStorage 저장 → App 렌더링
- **로그아웃**: localStorage에서 토큰 제거 → LoginPage로 전환

## 알려진 이슈

- [ ] 카카오 OAuth: 서버에서 kauth.kakao.com 호출 시 `unable to verify the first certificate` SSL 에러 (`--use-system-ca` 옵션으로도 해결 안 됨)
- [x] Sprint 8에서 수정 완료

## 완료 기준 체크

- [x] 게스트 로그인 → 토큰 발급 플로우 동작
- [x] 로그인하지 않으면 앱 사용 불가 (LoginPage 표시)
- [x] 유저 정보 조회/수정 API 구현
- [ ] 카카오 OAuth 로그인 (BLOCKED → 추후)
