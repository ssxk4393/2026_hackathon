import { create } from 'zustand';
import type { Stenographer, CaptionStyle } from '../../shared/types';
import { DEFAULT_CAPTION_STYLE, DEFAULT_STENOGRAPHERS } from '../../shared/types';

interface AppState {
  stenographers: Stenographer[];
  activeOperatorId: string;
  captionStyle: CaptionStyle;
  captionTexts: Record<string, string>;

  setActiveOperator: (id: string) => void;
  updateCaptionText: (stenographerId: string, text: string) => void;
  updateStyle: (style: Partial<CaptionStyle>) => void;
  setStenographers: (stenographers: Stenographer[]) => void;
  setCaptionStyle: (style: CaptionStyle) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  stenographers: DEFAULT_STENOGRAPHERS,
  activeOperatorId: 'A',
  captionStyle: DEFAULT_CAPTION_STYLE,
  captionTexts: {},

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
    // 현재 송출 담당자인 경우에만 자막 전송
    if (get().activeOperatorId === stenographerId) {
      window.electronAPI.updateCaption(text);
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
}));
