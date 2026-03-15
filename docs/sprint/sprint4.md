# Sprint 4: 세션 관리 + 역할 시스템

## 기간
2026-03-15 ~
**상태**: COMPLETED

## 목표
Sprint 3에서 구현한 서버/인증 기반 위에 **세션 기반 작업 플로우**를 완성한다.

## 구현 내역

### 서버 (server/src/routes/session.ts)
| API | 메서드 | 설명 |
|-----|--------|------|
| `/sessions/:id/captions` | POST | 자막 로그 저장 |
| `/sessions/:id/captions` | GET | 자막 이력 조회 (시간순) |
| `/sessions/:id/export?format=txt\|json` | GET | 세션 리포트 내보내기 |
| `/sessions/:id/leave` | POST | 세션 나가기 (leftAt 설정) |

기존 API (Sprint 3):
- `GET /sessions` — 활성 세션 목록
- `POST /sessions` — 세션 생성
- `POST /sessions/:id/join` — 세션 참가 (역할 자동 배정)
- `POST /sessions/:id/end` — 세션 종료 (생성자만)
- `GET /sessions/:id` — 세션 상세

### 프론트엔드

#### SessionLobby (신규)
- `src/renderer/components/SessionLobby.tsx`
- 활성 세션 목록 표시 + 새로고침
- 새 세션 생성 폼 (이름, 최대 송출자 수)
- 세션 참가 → 작업 화면 전환
- 유저 정보 + 로그아웃

#### App.tsx (수정)
- 3단계 앱 플로우: `미인증 → LoginPage | 인증+세션없음 → SessionLobby | 인증+세션있음 → 작업화면`
- 세션 나가기/종료 → 로비 복귀
- TXT/JSON 내보내기 다운로드
- 세션 생성자에게 "세션 종료" 버튼, 그 외에는 "나가기" 버튼

#### appStore (수정)
- `currentSession`, `authToken` 상태 추가
- `saveCaptionLog()` — 자막 입력 시 서버에 로그 자동 저장

### 공유 타입 (src/shared/types.ts)
- `SessionInfo`, `SessionMemberInfo`, `SessionUser`, `CaptionLogEntry` 타입 추가

## 앱 플로우
```
[게스트 로그인] → [세션 로비]
                    ├── 새 세션 생성 → [작업 화면]
                    └── 기존 세션 참가 → [작업 화면]
                                          ├── 자막 입력 → 서버 로그 자동 저장
                                          ├── 내보내기 (TXT/JSON)
                                          ├── 나가기 → [세션 로비]
                                          └── 세션 종료 (생성자) → [세션 로비]
```

## 역할 시스템
- **operator**: 자막 송출 가능 (maxOperators 이내 자동 배정)
- **standby**: 대기 상태 (maxOperators 초과 시 자동 배정)

## 검증 체크리스트
- [x] 게스트 로그인 → 세션 로비 표시
- [x] 새 세션 생성 → 목록에 표시
- [x] 세션 참가 → 작업 화면 전환
- [x] 자막 입력 → 서버에 로그 저장
- [x] 세션 종료 → TXT/JSON 내보내기
- [x] 세션 나가기 → 로비 복귀
- [x] 2명 초과 참가 시 standby 자동 배정
