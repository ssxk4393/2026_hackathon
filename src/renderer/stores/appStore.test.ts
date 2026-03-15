import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './appStore';
import { DEFAULT_CAPTION_STYLE } from '../../shared/types';

// Mock the socketService
vi.mock('../services/socketService', () => ({
  sendCaption: vi.fn(),
}));

// Use the electronAPI mock from test-setup.ts
const mockElectronAPI = window.electronAPI as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('appStore', () => {
  beforeEach(() => {
    // Reset the store to initial state
    useAppStore.setState({
      stenographers: [
        { id: 'A', name: '속기사 A', isActive: true },
        { id: 'B', name: '속기사 B', isActive: false },
      ],
      activeOperatorId: 'A',
      captionStyle: { ...DEFAULT_CAPTION_STYLE },
      captionTexts: {},
      currentSession: null,
      authToken: null,
    });
    vi.clearAllMocks();
  });

  describe('updateCaptionText', () => {
    it('should update captionTexts for a given stenographer', () => {
      useAppStore.getState().updateCaptionText('A', 'Hello world');

      const state = useAppStore.getState();
      expect(state.captionTexts['A']).toBe('Hello world');
    });

    it('should call electronAPI.updateCaption when active operator sends text (local mode)', () => {
      useAppStore.getState().updateCaptionText('A', 'Live caption');

      expect(mockElectronAPI.updateCaption).toHaveBeenCalledWith('Live caption');
    });

    it('should not call electronAPI.updateCaption for non-active operator (local mode)', () => {
      useAppStore.getState().updateCaptionText('B', 'B typing');

      expect(mockElectronAPI.updateCaption).not.toHaveBeenCalled();
    });

    it('should update captionTexts for multiple stenographers independently', () => {
      const store = useAppStore.getState();
      store.updateCaptionText('A', 'Text A');
      store.updateCaptionText('B', 'Text B');

      const state = useAppStore.getState();
      expect(state.captionTexts['A']).toBe('Text A');
      expect(state.captionTexts['B']).toBe('Text B');
    });
  });

  describe('updateStyle', () => {
    it('should merge partial style into captionStyle', () => {
      useAppStore.getState().updateStyle({ fontSize: 60 });

      const state = useAppStore.getState();
      expect(state.captionStyle.fontSize).toBe(60);
      // Other properties should remain unchanged
      expect(state.captionStyle.fontColor).toBe('#FFFFFF');
    });

    it('should call electronAPI.updateStyle with the merged style', () => {
      useAppStore.getState().updateStyle({ fontColor: '#FF0000' });

      expect(mockElectronAPI.updateStyle).toHaveBeenCalled();
      const calledWith = mockElectronAPI.updateStyle.mock.calls[0][0];
      expect(calledWith.fontColor).toBe('#FF0000');
      // fontFamily should remain at the default value
      expect(calledWith.fontFamily).toBe('Noto Sans KR, sans-serif');
    });

    it('should handle multiple partial updates', () => {
      useAppStore.getState().updateStyle({ fontSize: 60 });
      useAppStore.getState().updateStyle({ fontColor: '#00FF00' });

      const state = useAppStore.getState();
      expect(state.captionStyle.fontSize).toBe(60);
      expect(state.captionStyle.fontColor).toBe('#00FF00');
    });
  });

  describe('setActiveOperator', () => {
    it('should update activeOperatorId and call electronAPI', () => {
      useAppStore.getState().setActiveOperator('B');

      const state = useAppStore.getState();
      expect(state.activeOperatorId).toBe('B');
      expect(mockElectronAPI.switchOperator).toHaveBeenCalledWith('B');
    });

    it('should update stenographer isActive flags', () => {
      useAppStore.getState().setActiveOperator('B');

      const state = useAppStore.getState();
      const stA = state.stenographers.find((s) => s.id === 'A');
      const stB = state.stenographers.find((s) => s.id === 'B');
      expect(stA?.isActive).toBe(false);
      expect(stB?.isActive).toBe(true);
    });
  });
});
