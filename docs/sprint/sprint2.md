# Sprint 2: 디자인 리뉴얼

**기간**: 2026-03-14 ~ 2026-03-15
**상태**: COMPLETED

---

## 목표
전문적이고 세련된 UI/UX로 전면 개선한다.

## 완료된 태스크

| # | 태스크 | 상태 |
|---|--------|------|
| 2.1 | 디자인 시스템 구축 (색상, 타이포그래피, 그림자, 애니메이션 토큰) | DONE |
| 2.2 | 다크 테마 기본 적용 | DONE |
| 2.3 | 속기사 작업 화면 리디자인 (입력창, 여백, 아이콘) | DONE |
| 2.4 | 송출 전환 버튼 개선 (글로우 효과, 활성 상태 강조) | DONE |
| 2.5 | 상태바 추가 (송출자, 연결 모드, 속기사 수, 세션 타이머) | DONE |
| 2.6 | 자막 창 디자인 (fade/slide 애니메이션, 드래그 이동, ESC 잠금) | DONE |
| 2.8 | 반응형 레이아웃 (세로 반응형 + 사이드바 드래그 리사이즈) | DONE |

## 주요 구현 파일

- `tailwind.config.js` — 커스텀 디자인 토큰 (surface-0~3, accent, glow 효과, 애니메이션)
- `src/renderer/App.tsx` — 메인 레이아웃 (flex 반응형 + 사이드바 리사이즈)
- `src/renderer/components/ControlBar.tsx` — 송출 전환 버튼 + 자막 창 열기/닫기 토글
- `src/renderer/components/StatusBar.tsx` — 하단 상태바
- `src/renderer/components/StenographerPanel.tsx` — LIVE 뱃지, 아바타, 반응형 입력창
- `src/caption-window/CaptionDisplay.tsx` — 투명 오버레이, 드래그 이동, 닫기 버튼

## 디자인 시스템

```
Colors:
  surface-0: #0f0f1a    (배경)
  surface-1: #1a1a2e    (카드)
  surface-2: #25253e    (입력)
  surface-3: #2f2f4e    (호버)
  accent:    #4dabf7    (강조 파란색)
  active-operator: #51cf66 (송출 중 초록)
  border-subtle: #ffffff12

Shadows:
  glow-green: 0 0 20px rgba(81,207,102,0.3)
  glow-accent: 0 0 20px rgba(77,171,247,0.3)

Animations:
  fade-in, slide-in-right, pulse-slow
```

## UX 개선사항

- 자막 창: 전체화면 대신 투명 오버레이 + 자유 크기 조절
- 자막 창 닫기 상태 동기화: caption-window:closed IPC 이벤트
- 사이드바 리사이즈: 마우스 드래그로 240~600px 범위 조절
- 세로 반응형: flex-1 + min-h-0 패턴으로 모든 영역 균등 분배

## 완료 기준 체크

- [x] 디자인 시스템 토큰 tailwind.config.js에 정의
- [x] 전체 화면 일관된 다크 테마 비주얼
- [x] 자막 fade/slide 애니메이션 동작
