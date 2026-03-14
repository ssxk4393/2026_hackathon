import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type { CaptionStyle } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // 자막 업데이트
  updateCaption: (text: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CAPTION_UPDATE, text),

  // 송출 담당자 전환
  switchOperator: (id: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.OPERATOR_SWITCH, id),

  // 자막 스타일 업데이트
  updateStyle: (style: CaptionStyle) =>
    ipcRenderer.invoke(IPC_CHANNELS.STYLE_UPDATE, style),

  // 자막 창 열기/닫기
  openCaptionWindow: () =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CAPTION_OPEN),
  closeCaptionWindow: () =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CAPTION_CLOSE),

  // 설정 로드/저장
  loadSettings: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_LOAD),
  saveSettings: (settings: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SAVE, settings),

  // 자막 창에서 수신 (caption-window용)
  onCaptionUpdate: (callback: (text: string) => void) => {
    const handler = (_event: unknown, text: string) => callback(text);
    ipcRenderer.on('caption:display', handler);
    return () => ipcRenderer.removeListener('caption:display', handler);
  },

  onStyleUpdate: (callback: (style: CaptionStyle) => void) => {
    const handler = (_event: unknown, style: CaptionStyle) => callback(style);
    ipcRenderer.on('style:display', handler);
    return () => ipcRenderer.removeListener('style:display', handler);
  },

  // 자막 창 닫힘 이벤트 수신 (메인 화면용)
  onCaptionWindowClosed: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('caption-window:closed', handler);
    return () => ipcRenderer.removeListener('caption-window:closed', handler);
  },

  // 외부 브라우저 열기 (카카오 로그인 등)
  openExternal: (url: string) =>
    ipcRenderer.invoke('shell:open-external', url),

  // 인증 토큰 수신 (카카오 콜백에서)
  onAuthCallback: (callback: (data: { token: string; name: string; avatar: string }) => void) => {
    const handler = (_event: unknown, data: { token: string; name: string; avatar: string }) => callback(data);
    ipcRenderer.on('auth:callback', handler);
    return () => ipcRenderer.removeListener('auth:callback', handler);
  },
});
