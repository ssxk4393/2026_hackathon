import { app, BrowserWindow, screen, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { IPC_CHANNELS, DEFAULT_SETTINGS } from '../shared/types';
import type { UserSettings, CaptionStyle } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let captionWindow: BrowserWindow | null = null;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const PROTOCOL = 'caption-studio';

// 개발 모드에서 커스텀 프로토콜 등록
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}
const preloadPath = path.join(__dirname, '../preload/preload.js');

// 설정 파일 경로
const settingsPath = path.join(app.getPath('userData'), 'user-settings.json');

function loadSettings(): UserSettings {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    console.error('Failed to load settings, using defaults');
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: UserSettings): void {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch {
    console.error('Failed to save settings');
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    title: 'Realtime Caption Studio',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (captionWindow) {
      captionWindow.close();
      captionWindow = null;
    }
  });
}

function createCaptionWindow() {
  try {
    if (captionWindow) {
      captionWindow.focus();
      return;
    }

    // 두 번째 모니터 찾기
    const displays = screen.getAllDisplays();
    const primary = screen.getPrimaryDisplay();
    const external = displays.find((d) => d.id !== primary.id) ?? primary;

    console.log('[Caption] Creating window on display:', external.id, external.bounds);

    captionWindow = new BrowserWindow({
      x: external.bounds.x + Math.round(external.bounds.width * 0.1),
      y: external.bounds.y + Math.round(external.bounds.height * 0.6),
      width: Math.round(external.bounds.width * 0.8),
      height: 200,
      alwaysOnTop: true,
      frame: false,
      transparent: true,
      resizable: true,
      hasShadow: false,
      skipTaskbar: true,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const captionURL = VITE_DEV_SERVER_URL
      ? `${VITE_DEV_SERVER_URL}/caption.html`
      : path.join(__dirname, '../../dist/caption.html');

    if (VITE_DEV_SERVER_URL) {
      captionWindow.loadURL(captionURL);
    } else {
      captionWindow.loadFile(captionURL);
    }

    captionWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.error('[Caption] Failed to load:', errorCode, errorDescription);
    });

    captionWindow.on('closed', () => {
      captionWindow = null;
      // 메인 윈도우에 자막 창 닫힘 알림
      if (mainWindow) {
        mainWindow.webContents.send('caption-window:closed');
      }
    });
  } catch (err) {
    console.error('[Caption] Error creating window:', err);
  }
}

// IPC 핸들러 등록
function setupIPC() {
  ipcMain.handle(IPC_CHANNELS.CAPTION_UPDATE, (_event, text: string) => {
    if (captionWindow) {
      captionWindow.webContents.send('caption:display', text);
    }
  });

  ipcMain.handle(IPC_CHANNELS.OPERATOR_SWITCH, (_event, id: string) => {
    // main에서는 상태 관리 없이 단순 전달
    if (captionWindow) {
      captionWindow.webContents.send('operator:display', id);
    }
    return id;
  });

  ipcMain.handle(IPC_CHANNELS.STYLE_UPDATE, (_event, style: CaptionStyle) => {
    if (captionWindow) {
      captionWindow.webContents.send('style:display', style);
    }
    // 설정 저장
    const settings = loadSettings();
    settings.captionStyle = style;
    saveSettings(settings);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CAPTION_OPEN, () => {
    createCaptionWindow();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CAPTION_CLOSE, () => {
    if (captionWindow) {
      captionWindow.close();
      captionWindow = null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_LOAD, () => {
    return loadSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SAVE, (_event, settings: UserSettings) => {
    saveSettings(settings);
  });

  // 외부 브라우저 열기
  ipcMain.handle('shell:open-external', (_event, url: string) => {
    shell.openExternal(url);
  });
}

// 딥링크 URL에서 인증 정보 추출하여 렌더러로 전달
function handleDeepLink(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.pathname === '//auth/callback' || parsed.pathname === '/auth/callback') {
      const token = parsed.searchParams.get('token');
      const name = parsed.searchParams.get('name');
      const avatar = parsed.searchParams.get('avatar') || '';

      if (token && name && mainWindow) {
        mainWindow.webContents.send('auth:callback', { token, name, avatar });
        mainWindow.focus();
      }
    }
  } catch (err) {
    console.error('[DeepLink] Failed to parse:', err);
  }
}

// Windows: 두 번째 인스턴스 실행 시 딥링크 처리
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    // Windows에서 프로토콜 URL은 마지막 인자로 전달됨
    const deepLinkUrl = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`));
    if (deepLinkUrl) {
      handleDeepLink(deepLinkUrl);
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // macOS: open-url 이벤트
  app.on('open-url', (_event, url) => {
    handleDeepLink(url);
  });

  app.whenReady().then(() => {
    setupIPC();
    createMainWindow();
  });
}

app.on('window-all-closed', () => {
  app.quit();
});
