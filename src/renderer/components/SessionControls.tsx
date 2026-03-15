import { useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { useSocketStore } from '../stores/socketStore';
import { switchOperator, requestOperator } from '../services/socketService';

export function SessionControls() {
  const currentSession = useAppStore((s) => s.currentSession);
  const authToken = useAppStore((s) => s.authToken);
  const onlineMembers = useSocketStore((s) => s.onlineMembers);

  const currentOperator = onlineMembers.find((m) => m.role === 'operator');
  const standbyMembers = onlineMembers.filter((m) => m.role === 'standby');

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
  );
}
