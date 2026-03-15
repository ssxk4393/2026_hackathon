import { create } from 'zustand';
import type { Stenographer, CaptionStyle, SessionInfo } from '../../shared/types';
import { DEFAULT_CAPTION_STYLE, DEFAULT_STENOGRAPHERS } from '../../shared/types';
import { sendCaption as socketSendCaption } from '../services/socketService';

const API_BASE = 'http://localhost:3000';

// WebSocket 전송 디바운스 타이머 (50ms)
let socketDebounceTimer: ReturnType<typeof setTimeout> | null = null;

interface AppState {
  stenographers: Stenographer[];
  activeOperatorId: string;
  captionStyle: CaptionStyle;
  captionTexts: Record<string, string>;

  // 세션 상태
  currentSession: SessionInfo | null;
  authToken: string | null;

  setActiveOperator: (id: string) => void;
  updateCaptionText: (stenographerId: string, text: string) => void;
  updateStyle: (style: Partial<CaptionStyle>) => void;
  setStenographers: (stenographers: Stenographer[]) => void;
  setCaptionStyle: (style: CaptionStyle) => void;
  setCurrentSession: (session: SessionInfo | null) => void;
  setAuthToken: (token: string | null) => void;
  saveCaptionLog: (text: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  stenographers: DEFAULT_STENOGRAPHERS,
  activeOperatorId: 'A',
  captionStyle: DEFAULT_CAPTION_STYLE,
  captionTexts: {},
  currentSession: null,
  authToken: null,

  setActiveOperator: (id: string) => {
    set((state) => ({
      activeOperatorId: id,
      stenographers: state.stenographers.map((s) => ({
        ...s,
        isActive: s.id === id,
      })),
    }));
    window.electronAPI.switchOperator(id);
  },

  updateCaptionText: (stenographerId: string, text: string) => {
    set((state) => ({
      captionTexts: { ...state.captionTexts, [stenographerId]: text },
    }));

    const session = get().currentSession;

    if (session) {
      // 세션 모드: 로컬 CaptionWindow는 즉시 전송, WebSocket은 50ms 디바운스
      window.electronAPI.updateCaption(text);
      if (socketDebounceTimer) clearTimeout(socketDebounceTimer);
      socketDebounceTimer = setTimeout(() => {
        socketSendCaption(session.id, text);
      }, 50);
    } else if (get().activeOperatorId === stenographerId) {
      // 로컬 모드: 현재 송출 담당자인 경우에만 전송
      window.electronAPI.updateCaption(text);
      get().saveCaptionLog(text);
    }
  },

  updateStyle: (partial: Partial<CaptionStyle>) => {
    set((state) => {
      const newStyle = { ...state.captionStyle, ...partial };
      window.electronAPI.updateStyle(newStyle);
      return { captionStyle: newStyle };
    });
  },

  setStenographers: (stenographers) => set({ stenographers }),
  setCaptionStyle: (style) => set({ captionStyle: style }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setAuthToken: (token) => set({ authToken: token }),

  saveCaptionLog: (text: string) => {
    const { currentSession, authToken } = get();
    if (!currentSession || !authToken) return;

    fetch(`${API_BASE}/sessions/${currentSession.id}/captions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ text }),
    }).catch(() => {
      // 자막 로그 저장 실패는 무시 (송출에 영향 주지 않음)
    });
  },
}));
