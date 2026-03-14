import type { CaptionStyle, UserSettings } from '../shared/types';

export interface ElectronAPI {
  updateCaption: (text: string) => Promise<void>;
  switchOperator: (id: string) => Promise<string>;
  updateStyle: (style: CaptionStyle) => Promise<void>;
  openCaptionWindow: () => Promise<void>;
  closeCaptionWindow: () => Promise<void>;
  loadSettings: () => Promise<UserSettings>;
  saveSettings: (settings: UserSettings) => Promise<void>;
  onCaptionUpdate: (callback: (text: string) => void) => () => void;
  onStyleUpdate: (callback: (style: CaptionStyle) => void) => () => void;
  onCaptionWindowClosed: (callback: () => void) => () => void;
  openExternal: (url: string) => Promise<void>;
  onAuthCallback: (callback: (data: { token: string; name: string; avatar: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
