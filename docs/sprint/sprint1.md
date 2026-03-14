# Sprint 1: 자막 스타일 설정 UI

**기간**: 2026-03-13 ~ 2026-03-14
**상태**: COMPLETED

---

## 목표
속기사가 자막의 시각적 스타일을 실시간으로 조정할 수 있도록 한다.

## 완료된 태스크

| # | 태스크 | 상태 |
|---|--------|------|
| 1.1 | 스타일 설정 패널 UI (사이드바) | DONE |
| 1.2 | 폰트 선택기 (시스템 폰트 드롭다운, 한글 폰트 우선) | DONE |
| 1.3 | 글자 크기 슬라이더 (24px ~ 96px, 실시간 미리보기) | DONE |
| 1.4 | 글자색 / 배경색 피커 + 배경 투명도 슬라이더 | DONE |
| 1.5 | 텍스트 정렬(좌/중/우) / 위치(상/중/하) 토글 | DONE |
| 1.6 | 줄 간격(1.0~2.0) / 자간(-2px~5px) 조절 | DONE |
| 1.7 | user-settings.json 자동 저장 + 앱 재시작 시 복원 | DONE |
| 1.8 | 스타일 프리셋 5개 (기본/방송/강연/영화/고대비) | DONE |

## 주요 구현 파일

- `src/renderer/components/StyleSettingsPanel.tsx` — 스타일 설정 사이드바
- `src/shared/types.ts` — CaptionStyle 인터페이스, STYLE_PRESETS 상수
- `src/main/index.ts` — IPC 핸들러 (style:update, settings:load/save)
- `src/caption-window/CaptionDisplay.tsx` — 자막 출력 + 스타일 실시간 반영

## 기술 결정사항

- **상태 관리**: Zustand 사용 (단순하고 보일러플레이트 최소)
- **설정 저장**: Electron `app.getPath('userData')` + JSON 파일
- **IPC 패턴**: renderer → main → caption-window 단방향 데이터 흐름
- **CaptionStyle 타입**: fontFamily, fontSize, fontColor, bgColor, bgOpacity, textAlign, position, lineHeight, letterSpacing

## 완료 기준 체크

- [x] 설정 변경 시 자막 창에 실시간 반영
- [x] 앱 종료 후 재시작해도 설정 유지
- [x] 프리셋으로 한 번에 스타일 변경 가능
