/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';

// Mock window.electronAPI for component tests
Object.defineProperty(window, 'electronAPI', {
  value: {
    updateCaption: vi.fn(),
    switchOperator: vi.fn(),
    updateStyle: vi.fn(),
    openCaptionWindow: vi.fn(),
    closeCaptionWindow: vi.fn(),
    loadSettings: vi.fn().mockResolvedValue(null),
    saveSettings: vi.fn(),
    openExternal: vi.fn(),
    onAuthCallback: vi.fn().mockReturnValue(() => {}),
    onCaptionWindowClosed: vi.fn().mockReturnValue(() => {}),
  },
  writable: true,
});
