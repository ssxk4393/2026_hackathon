export interface Stenographer {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Caption {
  id: string;
  stenographerId: string;
  text: string;
  timestamp: number;
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  bgColor: string;
  bgOpacity: number;
  textAlign: 'left' | 'center' | 'right';
  position: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
}

export interface StylePreset {
  id: string;
  name: string;
  style: CaptionStyle;
}

export interface UserSettings {
  captionStyle: CaptionStyle;
  stenographers: Stenographer[];
  lastOperatorId: string;
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontFamily: 'Noto Sans KR, sans-serif',
  fontSize: 48,
  fontColor: '#FFFFFF',
  bgColor: '#000000',
  bgOpacity: 0.7,
  textAlign: 'center',
  position: 'bottom',
  lineHeight: 1.4,
  letterSpacing: 0,
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'default',
    name: '기본',
    style: {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: 48,
      fontColor: '#FFFFFF',
      bgColor: '#000000',
      bgOpacity: 0.7,
      textAlign: 'center',
      position: 'bottom',
      lineHeight: 1.4,
      letterSpacing: 0,
    },
  },
  {
    id: 'broadcast',
    name: '방송용',
    style: {
      fontFamily: 'Malgun Gothic, sans-serif',
      fontSize: 56,
      fontColor: '#FFFFFF',
      bgColor: '#000000',
      bgOpacity: 0.85,
      textAlign: 'center',
      position: 'bottom',
      lineHeight: 1.3,
      letterSpacing: 1,
    },
  },
  {
    id: 'lecture',
    name: '강연용',
    style: {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: 40,
      fontColor: '#FFFF00',
      bgColor: '#000000',
      bgOpacity: 0.6,
      textAlign: 'left',
      position: 'bottom',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
  },
  {
    id: 'highContrast',
    name: '고대비',
    style: {
      fontFamily: 'Malgun Gothic, sans-serif',
      fontSize: 52,
      fontColor: '#FFFFFF',
      bgColor: '#0000AA',
      bgOpacity: 0.9,
      textAlign: 'center',
      position: 'bottom',
      lineHeight: 1.4,
      letterSpacing: 0,
    },
  },
  {
    id: 'minimal',
    name: '미니멀',
    style: {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: 36,
      fontColor: '#E0E0E0',
      bgColor: '#000000',
      bgOpacity: 0.4,
      textAlign: 'center',
      position: 'bottom',
      lineHeight: 1.6,
      letterSpacing: 0.5,
    },
  },
];

export const DEFAULT_STENOGRAPHERS: Stenographer[] = [
  { id: 'A', name: '속기사 A', isActive: true },
  { id: 'B', name: '속기사 B', isActive: false },
];

export const DEFAULT_SETTINGS: UserSettings = {
  captionStyle: DEFAULT_CAPTION_STYLE,
  stenographers: DEFAULT_STENOGRAPHERS,
  lastOperatorId: 'A',
};

// Session 관련 타입
export interface SessionUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface SessionMemberInfo {
  id: string;
  sessionId: string;
  userId: string;
  role: 'operator' | 'standby';
  joinedAt: string;
  leftAt: string | null;
  user: SessionUser;
}

export interface SessionInfo {
  id: string;
  name: string;
  status: 'active' | 'ended';
  maxOperators: number;
  createdBy: string;
  creator: SessionUser;
  createdAt: string;
  endedAt: string | null;
  members: SessionMemberInfo[];
}

export interface CaptionLogEntry {
  id: string;
  sessionId: string;
  userId: string;
  text: string;
  createdAt: string;
}

// WebSocket 이벤트 타입
export interface ClientToServerEvents {
  'session:join': (data: { sessionId: string }) => void;
  'session:leave': (data: { sessionId: string }) => void;
  'caption:send': (data: { sessionId: string; text: string }) => void;
  'operator:switch': (data: { sessionId: string; operatorUserId: string }) => void;
  'operator:request': (data: { sessionId: string }) => void;
}

export interface OperatorSwitchedData {
  newOperatorUserId: string;
  newOperatorName: string;
  oldOperatorUserId: string;
  oldOperatorName: string;
}

export interface ServerToClientEvents {
  'caption:broadcast': (data: { text: string; userId: string; userName: string; timestamp: number }) => void;
  'operator:switched': (data: OperatorSwitchedData) => void;
  'member:joined': (data: { userId: string; name: string; role: 'operator' | 'standby' }) => void;
  'member:left': (data: { userId: string }) => void;
  'members:list': (data: OnlineMember[]) => void;
  'session:ended': (data: { sessionId: string }) => void;
  'error': (data: { message: string }) => void;
}

export interface OnlineMember {
  userId: string;
  name: string;
  role: 'operator' | 'standby';
}

// IPC 채널 상수
export const IPC_CHANNELS = {
  CAPTION_UPDATE: 'caption:update',
  OPERATOR_SWITCH: 'operator:switch',
  STYLE_UPDATE: 'style:update',
  WINDOW_CAPTION_OPEN: 'window:caption-open',
  WINDOW_CAPTION_CLOSE: 'window:caption-close',
  SETTINGS_LOAD: 'settings:load',
  SETTINGS_SAVE: 'settings:save',
} as const;
