# Sprint 6: 대기 영역 + 교대 시스템

## 기간
2026-03-15 ~
**상태**: COMPLETED

## 목표
3명 이상 속기사 협업 시 operator/standby 역할 분리 UI와 교대 시스템을 구현한다.

## 구현 내역

### 서버 — 교대 요청 핸들러 (`server/src/socket/handlers.ts`)
- `operator:request` 이벤트: standby가 교대 요청 → DB role 교체 (트랜잭션) → 전체 브로드캐스트
- `operator:switched` payload 확장: `newOperatorUserId/Name`, `oldOperatorUserId/Name`
- operator 이탈 시 자동 승격: 첫 번째 standby → operator 자동 이관
- `broadcastMembersList`: 교대/입퇴장 시 전체 멤버 목록 재전송

### 프론트엔드

| 파일 | 변경 |
|------|------|
| `StandbyPanel.tsx` | **신규** — 현재 자막 모니터링, 연습 입력, 교대 요청 버튼 |
| `App.tsx` | 세션 모드 role 기반 UI 분기 (operator→입력패널, standby→StandbyPanel) |
| `ControlBar.tsx` | 세션 모드: 현재 operator 표시 / 로컬 모드: F1~F4 전환 |
| `socketStore.ts` | `updateMemberRole` 액션 추가 |
| `socketService.ts` | `requestOperator` 함수, 콜백 타입 확장 |
| `types.ts` | `operator:request` 이벤트, `OperatorSwitchedData` 타입, OnlineMember role 강화 |

### UI 모드 분기

```
세션 모드 + operator:
  ┌─────────────────────┐
  │ StenographerPanel   │  ← 자막 입력 (Enter로 송출)
  │ (LIVE)              │
  └─────────────────────┘

세션 모드 + standby:
  ┌─────────────────────┐
  │ 현재 송출 자막 모니터│  ← operator 자막 실시간 표시
  ├─────────────────────┤
  │ 연습 입력 영역      │  ← 송출 안 됨
  ├─────────────────────┤
  │ [송출 교대 요청]    │  ← 클릭 → operator 교체
  └─────────────────────┘

로컬 모드 (세션 없음):
  ┌──────────┐ ┌──────────┐
  │ 속기사 A │ │ 속기사 B │  ← 기존과 동일
  └──────────┘ └──────────┘
```

## 교대 플로우
1. Standby가 "송출 교대 요청" 클릭
2. 서버: DB에서 role 교체 (현재 operator → standby, 요청자 → operator)
3. 서버: `operator:switched` + `members:list` 브로드캐스트
4. 클라이언트: role 변경 감지 → UI 자동 전환

## 엣지케이스 처리
- Operator 이탈 → 첫 번째 standby 자동 승격
- 1인 세션 → 자동 operator
- 세션 모드에서 F1~F4 단축키 비활성화

## 검증 체크리스트
- [x] 세션 모드에서 operator는 입력 패널 표시
- [x] 세션 모드에서 standby는 모니터링 + 연습 패널 표시
- [x] 교대 요청 → role 교체 → UI 전환
- [x] operator 이탈 시 standby 자동 승격
- [x] 로컬 모드에서 기존 동작 유지

---

## 일일 진행 기록

### Day 1: 서버 교대 로직 구현
- `operator:request` 소켓 이벤트 핸들러 구현 (standby → operator 교대)
- DB 트랜잭션 기반 role 교체 (prisma.$transaction)
- operator 이탈 시 자동 승격 로직 (leaveSession 내 첫 번째 standby 승격)
- **블로킹 이슈**: 교대 시 메모리(sessionMembers Map)와 DB 간 role 불일치 → 트랜잭션 후 메모리도 즉시 업데이트
- **의사결정**: 교대 승인 플로우(요청→승인) vs 즉시 교대 → 해커톤 MVP 특성상 즉시 교대 채택 (향후 승인 플로우 추가 예정)

### Day 2: 프론트엔드 역할 기반 UI
- StandbyPanel.tsx 신규 컴포넌트 (현재 자막 모니터링 + 연습 입력 + 교대 요청 버튼)
- RemoteOperatorPanel.tsx 신규 컴포넌트 (다른 operator 자막 읽기 전용)
- App.tsx role 기반 UI 분기 (operator → StenographerPanel, standby → StandbyPanel)
- ControlBar.tsx 세션 모드 UI (현재 operator 표시, 넘기기/요청 버튼)
- **블로킹 이슈**: onlineMembers에서 자신의 role 판별 시 JWT decode 필요 → getCurrentUserId() 유틸 추출
- **의사결정**: standby 연습 입력을 서버로 전송할지 → 로컬에서만 유지 (불필요한 트래픽 방지)

### Day 3: 통합 테스트 + 엣지케이스
- 3명 접속 시나리오 테스트 (2 operator + 1 standby)
- 교대 요청 → role 교체 → UI 자동 전환 검증
- operator 이탈 → standby 자동 승격 검증
- 세션 모드에서 F1~F4 단축키 비활성화 확인
- **의사결정**: multi-operator 세션에서 교대 대상 → 첫 번째 operator와 교체 (단순화)

---

## 블로킹 이슈 및 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| 메모리-DB role 불일치 | 교대 시 DB만 업데이트되고 sessionMembers Map은 그대로 | 트랜잭션 후 Map도 즉시 갱신 |
| JWT decode 반복 호출 | ControlBar + App에서 매 렌더마다 atob() 호출 | Sprint 8에서 useMemo로 최적화 |
| standby 패널 자막 미표시 | captionsByUser가 broadcast 전에 초기화됨 | socketStore에 captionsByUser 상태 추가로 해결 |
| F1~F4 세션 모드 충돌 | 세션 모드에서도 로컬 operator 전환 동작 | isSessionMode 조건으로 단축키 비활성화 |
