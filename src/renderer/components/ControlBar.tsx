import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { useSocketStore } from '../stores/socketStore';
import { switchOperator, requestOperator } from '../services/socketService';

interface ControlBarProps {
  onToggleStyle: () => void;
  isStyleOpen: boolean;
  isSessionMode?: boolean;
}

export function ControlBar({ onToggleStyle, isStyleOpen, isSessionMode = false }: ControlBarProps) {
  const stenographers = useAppStore((s) => s.stenographers);
  const activeOperatorId = useAppStore((s) => s.activeOperatorId);
  const setActiveOperator = useAppStore((s) => s.setActiveOperator);
  const onlineMembers = useSocketStore((s) => s.onlineMembers);
  const [isCaptionOpen, setIsCaptionOpen] = useState(false);

  // 자막 창이 외부에서 닫힐 때 상태 동기화
  useEffect(() => {
    const unsub = window.electronAPI.onCaptionWindowClosed(() => {
      setIsCaptionOpen(false);
    });
    return unsub;
  }, []);

  const toggleCaptionWindow = () => {
    if (isCaptionOpen) {
      window.electronAPI.closeCaptionWindow();
      setIsCaptionOpen(false);
    } else {
      window.electronAPI.openCaptionWindow();
      setIsCaptionOpen(true);
    }
  };

  const currentSession = useAppStore((s) => s.currentSession);
  const authToken = useAppStore((s) => s.authToken);
  const currentOperator = onlineMembers.find((m) => m.role === 'operator');
  const standbyMembers = onlineMembers.filter((m) => m.role === 'standby');

  // 내 역할 계산 (authToken이 변경될 때만 재계산)
  const myUserId = useMemo(() => {
    if (!authToken) return '';
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      return payload.userId || '';
    } catch {
      return '';
    }
  }, [authToken]);
  const myRole = onlineMembers.find((m) => m.userId === myUserId)?.role || 'operator';

  return (
    <div className="border-t border-border-subtle bg-surface-1 px-5 py-3">
      <div className="flex items-center gap-4">
        {/* 세션 모드: 현재 operator + 교대 UI / 로컬 모드: 송출 전환 */}
        {isSessionMode ? (
          <div className="flex items-center gap-3">
            {/* 현재 송출자 */}
            <span className="text-xs font-medium text-text-muted">현재 송출</span>
            <div className="flex items-center gap-1.5 rounded-lg bg-active-operator/10 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse-slow rounded-full bg-active-operator" />
              <span className="text-xs font-semibold text-active-operator">
                {currentOperator?.name || '없음'}
              </span>
            </div>
            <span className="text-xs text-text-muted/50">
              접속 {onlineMembers.length}명
            </span>

            {/* 구분선 */}
            <div className="h-4 w-px bg-border-subtle" />

            {/* operator: standby에게 넘기기 버튼들 */}
            {myRole === 'operator' && standbyMembers.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted">넘기기</span>
                {standbyMembers.map((m) => (
                  <button
                    key={m.userId}
                    onClick={() => currentSession && switchOperator(currentSession.id, m.userId)}
                    className="rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400 transition-all hover:bg-yellow-500/20"
                    title={`${m.name}에게 송출 넘기기`}
                  >
                    → {m.name}
                  </button>
                ))}
              </div>
            )}

            {/* standby: 교대 요청 버튼 */}
            {myRole === 'standby' && (
              <button
                onClick={() => currentSession && requestOperator(currentSession.id)}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110"
              >
                송출 교대 요청
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted">송출 전환</span>
            <div className="flex gap-1.5">
              {stenographers.map((s, i) => {
                const isActive = activeOperatorId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveOperator(s.id)}
                    className={`group relative rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-active-operator text-white shadow-glow-green'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -top-0.5 right-1 h-2 w-2 rounded-full bg-active-operator animate-pulse-slow" />
                    )}
                    <span className="text-text-muted/60 mr-1">F{i + 1}</span>
                    {s.id}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 구분선 */}
        <div className="h-6 w-px bg-border-subtle" />

        {/* 액션 버튼들 */}
        <div className="ml-auto flex gap-2">
          <button
            onClick={onToggleStyle}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 ${
              isStyleOpen
                ? 'bg-accent/20 text-accent'
                : 'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            스타일
          </button>
          <button
            onClick={toggleCaptionWindow}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              isCaptionOpen
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-accent text-white hover:bg-accent-hover hover:shadow-glow-accent'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            {isCaptionOpen ? '자막 창 닫기' : '자막 창 열기'}
          </button>
        </div>
      </div>
    </div>
  );
}
