import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { useAppStore } from './stores/appStore';
import { useSocketStore } from './stores/socketStore';
import { StenographerPanel } from './components/StenographerPanel';
import { StandbyPanel } from './components/StandbyPanel';
import { RemoteOperatorPanel } from './components/RemoteOperatorPanel';
import { ControlBar } from './components/ControlBar';
import { StatusBar } from './components/StatusBar';

const StyleSettingsPanel = lazy(() => import('./components/StyleSettingsPanel').then(m => ({ default: m.StyleSettingsPanel })));
const SessionLobby = lazy(() => import('./components/SessionLobby').then(m => ({ default: m.SessionLobby })));
const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
import {
  connectSocket,
  joinSession,
  leaveSession as socketLeaveSession,
  disconnectSocket,
} from './services/socketService';
import { apiRequest, setUnauthorizedHandler } from './services/apiClient';
import type { SessionInfo } from '../shared/types';

interface AuthUser {
  token: string;
  name: string;
  avatar: string;
}

export function App() {
  const stenographers = useAppStore((s) => s.stenographers);
  const setActiveOperator = useAppStore((s) => s.setActiveOperator);
  const setCaptionStyle = useAppStore((s) => s.setCaptionStyle);
  const setStenographers = useAppStore((s) => s.setStenographers);
  const setCurrentSession = useAppStore((s) => s.setCurrentSession);
  const setAuthToken = useAppStore((s) => s.setAuthToken);
  const currentSession = useAppStore((s) => s.currentSession);
  const [isStylePanelOpen, setIsStylePanelOpen] = useState(false);
  const [stylePanelWidth, setStylePanelWidth] = useState(320);
  const isResizing = useRef(false);

  // 인증 상태
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Socket 상태
  const setConnectionStatus = useSocketStore((s) => s.setConnectionStatus);
  const setOnlineMembers = useSocketStore((s) => s.setOnlineMembers);
  const addOnlineMember = useSocketStore((s) => s.addOnlineMember);
  const removeOnlineMember = useSocketStore((s) => s.removeOnlineMember);
  const setLastCaption = useSocketStore((s) => s.setLastCaption);
  const updateMemberRole = useSocketStore((s) => s.updateMemberRole);
  const resetSocket = useSocketStore((s) => s.reset);
  const onlineMembers = useSocketStore((s) => s.onlineMembers);

  // 현재 유저의 role 계산
  const currentUserId = user ? getCurrentUserId(user.token) : '';
  const myRole = onlineMembers.find((m) => m.userId === currentUserId)?.role || 'operator';
  const isSessionMode = currentSession !== null;

  // 로컬스토리지에서 저장된 인증 정보 복원
  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setAuthToken(parsed.token);
      } catch { /* ignore */ }
    }
    setIsAuthLoading(false);
  }, [setAuthToken]);

  // 딥링크를 통한 인증 콜백 수신
  useEffect(() => {
    const cleanup = window.electronAPI.onAuthCallback((data) => {
      const authUser: AuthUser = {
        token: data.token,
        name: data.name,
        avatar: data.avatar,
      };
      setUser(authUser);
      setAuthToken(data.token);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
    });
    return cleanup;
  }, [setAuthToken]);

  const handleLogin = (token: string, name: string, avatar: string) => {
    const authUser: AuthUser = { token, name, avatar };
    setUser(authUser);
    setAuthToken(token);
    localStorage.setItem('auth_user', JSON.stringify(authUser));
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    setCurrentSession(null);
    localStorage.removeItem('auth_user');
  };

  // 401 자동 로그아웃 핸들러 등록
  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
  }, []);

  const handleJoinSession = (session: SessionInfo) => {
    setCurrentSession(session);
  };

  // 세션 입장 시 Socket 연결
  useEffect(() => {
    if (!currentSession || !user) return;

    connectSocket(user.token, {
      onStatusChange: setConnectionStatus,
      onCaptionBroadcast: (data) => {
        setLastCaption(data);
        // 원격 자막을 로컬 CaptionWindow에도 표시
        window.electronAPI.updateCaption(data.text);
      },
      onOperatorSwitched: (data) => {
        updateMemberRole(data.newOperatorUserId, 'operator');
        updateMemberRole(data.oldOperatorUserId, 'standby');
      },
      onMemberJoined: (data) => {
        addOnlineMember(data);
      },
      onMemberLeft: (data) => {
        removeOnlineMember(data.userId);
      },
      onMembersList: (data) => {
        setOnlineMembers(data);
      },
      onSessionEnded: () => {
        setCurrentSession(null);
      },
    });

    // room 입장
    joinSession(currentSession.id);

    return () => {
      socketLeaveSession(currentSession.id);
      disconnectSocket();
      resetSocket();
    };
  }, [currentSession?.id, user?.token]);

  const handleLeaveSession = async () => {
    if (!currentSession || !user) {
      setCurrentSession(null);
      return;
    }

    try {
      await apiRequest(`/sessions/${currentSession.id}/leave`, {
        method: 'POST',
        token: user.token,
      });
    } catch {
      // 나가기 실패해도 UI는 로비로 복귀
    }

    setCurrentSession(null);
  };

  const handleEndSession = async () => {
    if (!currentSession || !user) return;

    try {
      await apiRequest(`/sessions/${currentSession.id}/end`, {
        method: 'POST',
        token: user.token,
      });
    } catch {
      // 종료 실패
    }

    setCurrentSession(null);
  };

  const handleExportSession = async (format: 'txt' | 'json') => {
    if (!currentSession || !user) return;

    try {
      const res = await fetch(
        `http://localhost:3000/sessions/${currentSession.id}/export?format=${format}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${currentSession.id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // 내보내기 실패
    }
  };

  // 설정 로드
  useEffect(() => {
    window.electronAPI.loadSettings().then((settings) => {
      if (settings) {
        if (settings.captionStyle) setCaptionStyle(settings.captionStyle);
        if (settings.stenographers) setStenographers(settings.stenographers);
        if (settings.lastOperatorId) setActiveOperator(settings.lastOperatorId);
      }
    });
  }, [setCaptionStyle, setStenographers, setActiveOperator]);

  // 글로벌 단축키: F1~F4로 송출 전환 (로컬 모드에서만)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isSessionMode) return; // 세션 모드에서는 비활성화
      const map: Record<string, string> = {
        F1: 'A',
        F2: 'B',
        F3: 'C',
        F4: 'D',
      };
      if (map[e.key]) {
        e.preventDefault();
        setActiveOperator(map[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveOperator, isSessionMode]);

  // 패널 리사이즈 핸들러
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = stylePanelWidth;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX - e.clientX;
      const newWidth = Math.min(Math.max(startWidth + delta, 240), 600);
      setStylePanelWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [stylePanelWidth]);

  // 로딩 중
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="text-text-muted">로딩 중...</div>
      </div>
    );
  }

  // 미인증 → 로그인 페이지
  if (!user) {
    return (
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-surface-0"><div className="text-text-muted">로딩 중...</div></div>}>
        <LoginPage onLogin={handleLogin} />
      </Suspense>
    );
  }

  // 인증 + 세션 없음 → 세션 로비
  if (!currentSession) {
    return (
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-surface-0"><div className="text-text-muted">로딩 중...</div></div>}>
        <SessionLobby
          token={user.token}
          userName={user.name}
          userAvatar={user.avatar}
          onJoinSession={handleJoinSession}
          onLogout={handleLogout}
        />
      </Suspense>
    );
  }

  // 인증 + 세션 있음 → 작업 화면
  const isCreator = currentSession.createdBy === currentUserId;

  return (
    <div className="flex h-screen flex-col bg-surface-0">
      {/* 타이틀바 */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border-subtle bg-surface-1 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
          <span className="text-sm font-bold text-accent">RC</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-text-primary">Realtime Caption Studio</h1>
          <p className="truncate text-xs text-text-muted">{currentSession.name}</p>
        </div>
        {/* 세션 정보 + 유저 정보 */}
        <div className="ml-auto flex items-center gap-3">
          {/* 온라인 멤버 표시 */}
          <div className="flex items-center gap-1 overflow-hidden">
            {onlineMembers.map((m) => (
              <div
                key={m.userId}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  m.role === 'operator'
                    ? 'bg-active-operator/20 text-active-operator'
                    : 'bg-surface-3 text-text-muted'
                }`}
                title={`${m.name} (${m.role})`}
              >
                {m.name[0]}
              </div>
            ))}
          </div>

          <div className="h-4 w-px bg-border-subtle" />

          <div className="flex items-center gap-2">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                {user.name[0]}
              </div>
            )}
            <span className="text-sm text-text-primary">{user.name}</span>
            {/* 내 역할 뱃지 */}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              myRole === 'operator'
                ? 'bg-active-operator/15 text-active-operator'
                : 'bg-yellow-500/15 text-yellow-400'
            }`}>
              {myRole === 'operator' ? 'OPERATOR' : 'STANDBY'}
            </span>
          </div>

          {/* 내보내기 */}
          <div className="flex gap-1">
            <button
              onClick={() => handleExportSession('txt')}
              className="rounded-lg px-2 py-1 text-xs text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
              title="TXT로 내보내기"
            >
              TXT
            </button>
            <button
              onClick={() => handleExportSession('json')}
              className="rounded-lg px-2 py-1 text-xs text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
              title="JSON으로 내보내기"
            >
              JSON
            </button>
          </div>

          {/* 세션 나가기 / 종료 */}
          {isCreator ? (
            <button
              onClick={handleEndSession}
              className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
            >
              세션 종료
            </button>
          ) : (
            <button
              onClick={handleLeaveSession}
              className="rounded-lg px-2.5 py-1 text-xs text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              나가기
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 메인 영역 */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* 세션 모드: role 기반 패널 / 로컬 모드: 기존 패널 */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
            {isSessionMode ? (
              <>
                {/* 내 패널: 항상 표시 (operator면 입력 가능, standby면 연습용) */}
                <StenographerPanel
                  key={currentUserId}
                  stenographer={{
                    id: currentUserId,
                    name: user.name,
                    isActive: myRole === 'operator',
                  }}
                />
                {/* 다른 operator 패널: 읽기 전용 */}
                {onlineMembers
                  .filter((m) => m.role === 'operator' && m.userId !== currentUserId)
                  .map((m) => (
                    <RemoteOperatorPanel
                      key={m.userId}
                      userId={m.userId}
                      name={m.name}
                    />
                  ))}
              </>
            ) : (
              // 로컬 모드: 기존 패널
              stenographers.map((s) => (
                <StenographerPanel key={s.id} stenographer={s} />
              ))
            )}
          </div>

          {/* 컨트롤 바 */}
          <ControlBar
            onToggleStyle={() => setIsStylePanelOpen((v) => !v)}
            isStyleOpen={isStylePanelOpen}
            isSessionMode={isSessionMode}
          />
        </div>

        {/* 스타일 설정 사이드바 */}
        {isStylePanelOpen && (
          <div className="flex shrink-0 animate-slide-in-right">
            {/* 리사이즈 핸들 */}
            <div
              onMouseDown={handleResizeStart}
              className="group flex w-1.5 cursor-col-resize items-center justify-center hover:bg-accent/20"
            >
              <div className="h-8 w-0.5 rounded-full bg-border-subtle transition-colors group-hover:bg-accent" />
            </div>
            <Suspense fallback={null}>
              <StyleSettingsPanel onClose={() => setIsStylePanelOpen(false)} width={stylePanelWidth} />
            </Suspense>
          </div>
        )}
      </div>

      {/* 상태바 */}
      <StatusBar />
    </div>
  );
}

/** JWT에서 userId 추출 (base64 디코딩) */
function getCurrentUserId(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || '';
  } catch {
    return '';
  }
}
