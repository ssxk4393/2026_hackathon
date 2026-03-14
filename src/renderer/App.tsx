import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from './stores/appStore';
import { StenographerPanel } from './components/StenographerPanel';
import { ControlBar } from './components/ControlBar';
import { StyleSettingsPanel } from './components/StyleSettingsPanel';
import { StatusBar } from './components/StatusBar';
import { LoginPage } from './components/LoginPage';

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
  const [isStylePanelOpen, setIsStylePanelOpen] = useState(false);
  const [stylePanelWidth, setStylePanelWidth] = useState(320);
  const isResizing = useRef(false);

  // 인증 상태
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 로컬스토리지에서 저장된 인증 정보 복원
  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch { /* ignore */ }
    }
    setIsAuthLoading(false);
  }, []);

  // 딥링크를 통한 인증 콜백 수신
  useEffect(() => {
    const cleanup = window.electronAPI.onAuthCallback((data) => {
      const authUser: AuthUser = {
        token: data.token,
        name: data.name,
        avatar: data.avatar,
      };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
    });
    return cleanup;
  }, []);

  const handleLogin = (token: string, name: string, avatar: string) => {
    const authUser: AuthUser = { token, name, avatar };
    setUser(authUser);
    localStorage.setItem('auth_user', JSON.stringify(authUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
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

  // 글로벌 단축키: F1~F4로 송출 전환
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
  }, [setActiveOperator]);

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
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen flex-col bg-surface-0">
      {/* 타이틀바 */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-1 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
          <span className="text-sm font-bold text-accent">RC</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-text-primary">Realtime Caption Studio</h1>
          <p className="text-xs text-text-muted">실시간 자막 송출</p>
        </div>
        {/* 유저 정보 & 로그아웃 */}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                {user.name[0]}
              </div>
            )}
            <span className="text-sm text-text-primary">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-2.5 py-1 text-xs text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 메인 영역 */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* 속기사 패널들 — flex-1로 남은 공간 모두 차지 + 내부 패널도 균등 분배 */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
            {stenographers.map((s) => (
              <StenographerPanel key={s.id} stenographer={s} />
            ))}
          </div>

          {/* 컨트롤 바 */}
          <ControlBar
            onToggleStyle={() => setIsStylePanelOpen((v) => !v)}
            isStyleOpen={isStylePanelOpen}
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
            <StyleSettingsPanel onClose={() => setIsStylePanelOpen(false)} width={stylePanelWidth} />
          </div>
        )}
      </div>

      {/* 상태바 */}
      <StatusBar />
    </div>
  );
}
