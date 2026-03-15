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
