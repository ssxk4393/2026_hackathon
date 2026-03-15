# Sprint 8: 안정화 + 릴리스

## 기간
2026-03-15

## 목표
Sprint 1~6 완성 코드를 안정화, 테스트/에러 핸들링/성능 최적화 후 릴리스 준비

## 완료 항목

### Phase 1: 테스트 인프라 + 테스트

- vitest 설정 (루트 + 서버)
- 서버 단위 테스트: JWT 인증 (`auth.test.ts`), 소켓 핸들러 (`handlers.test.ts`)
- 서버 API 통합 테스트: 인증 (`auth.test.ts`), 세션 CRUD + 자막 + 내보내기 (`session.test.ts`)
- 클라이언트 스토어 테스트: `appStore`, `socketStore`
- 총 51개 테스트 통과

### Phase 2: 버그 수정 + 에러 핸들링

- 버그 수정: 세션 종료 시 `notifySessionEnded` 호출 추가
- 서버: Express 글로벌 에러 핸들러, 모든 라우트 try-catch, 소켓 핸들러 try-catch
- 클라이언트: `apiClient.ts` (401 자동 로그아웃), `App.tsx`/`SessionLobby.tsx` 적용
- WebSocket: reconnect 시 세션 재입장, error 이벤트 리스너

### Phase 3: 성능 최적화

- WebSocket 자막 디바운싱 (50ms, 로컬 IPC는 즉시)
- ControlBar JWT decode `useMemo` 최적화
- StatusBar 자막 지연시간(ms) 표시

### Phase 4: 빌드 준비

- `build/icon.ico` 생성
- `server/.env.example` 생성
- `tsc --noEmit` 타입 검증

### Phase 5: 문서화

- `docs/USER_GUIDE.md` (사용자 매뉴얼)
- `docs/sprint/sprint8.md` (Sprint 기록)

## 수정 파일 목록

### Phase 1: 테스트
| 파일 | 변경 |
|------|------|
| `vitest.config.ts` | 루트 vitest 설정 추가 |
| `server/vitest.config.ts` | 서버 vitest 설정 추가 |
| `server/src/__tests__/unit/auth.test.ts` | JWT 인증 단위 테스트 |
| `server/src/__tests__/unit/handlers.test.ts` | 소켓 핸들러 단위 테스트 |
| `server/src/__tests__/integration/auth.test.ts` | 인증 API 통합 테스트 |
| `server/src/__tests__/integration/session.test.ts` | 세션 CRUD/자막/내보내기 통합 테스트 |
| `src/renderer/stores/appStore.test.ts` | appStore Zustand 테스트 |
| `src/renderer/stores/socketStore.test.ts` | socketStore Zustand 테스트 |

### Phase 2: 에러 핸들링
| 파일 | 변경 |
|------|------|
| `server/src/index.ts` | 글로벌 에러 핸들러 추가 |
| `server/src/routes/auth.ts` | try-catch 래핑 |
| `server/src/routes/session.ts` | try-catch 래핑 |
| `server/src/socket/handlers.ts` | 소켓 핸들러 try-catch, `notifySessionEnded` 버그 수정 |
| `src/renderer/services/apiClient.ts` | 401 자동 로그아웃, 공통 에러 처리 |
| `src/renderer/services/socketService.ts` | reconnect 시 세션 재입장, error 리스너 |
| `src/renderer/App.tsx` | `setUnauthorizedHandler` 등록 |
| `src/renderer/components/SessionLobby.tsx` | apiClient 적용 |

### Phase 3: 성능 최적화
| 파일 | 변경 |
|------|------|
| `src/renderer/components/StenographerPanel.tsx` | 자막 디바운싱 (50ms WebSocket) |
| `src/renderer/components/ControlBar.tsx` | JWT decode `useMemo` 최적화 |
| `src/renderer/components/StatusBar.tsx` | 자막 지연시간(ms) 표시 |

### Phase 4: 빌드 준비
| 파일 | 변경 |
|------|------|
| `build/icon.ico` | 앱 아이콘 생성 |
| `server/.env.example` | 환경 변수 템플릿 |

### Phase 5: 문서화
| 파일 | 변경 |
|------|------|
| `docs/USER_GUIDE.md` | 사용자 매뉴얼 (설치~자막 창 사용법) |
| `docs/sprint/sprint8.md` | Sprint 8 기록 |

## 기술 결정 사항

### 테스트 전략
- **vitest** 채택: Vite 기반 프로젝트와의 호환성, 빠른 실행 속도
- 서버: 단위 테스트(비즈니스 로직) + 통합 테스트(API 엔드포인트)
- 클라이언트: Zustand 스토어 상태 관리 테스트

### 에러 핸들링 전략
- 서버: 글로벌 에러 핸들러로 미처리 예외 방지, 모든 라우트/소켓 핸들러에 try-catch
- 클라이언트: `apiClient`에서 401 응답 시 자동 로그아웃, WebSocket reconnect 시 세션 재입장

### 성능 최적화
- WebSocket 자막 송출 50ms 디바운싱: 빠른 타이핑 시 불필요한 전송 감소
- 로컬 IPC는 디바운싱 없이 즉시 전송: 지연 없는 자막 출력 보장
- JWT decode를 `useMemo`로 캐싱: 불필요한 재계산 방지

## 다음 단계

- [ ] Electron 인스톨러 빌드 (`npm run build:win`)
- [ ] 카카오 OAuth SSL 이슈 해결
- [ ] 네이버 OAuth 추가
- [ ] 커스텀 폰트 업로드 기능
- [ ] 원격 송출 지원 (서버 기반 자막 창)
