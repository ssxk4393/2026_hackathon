import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { useSocketStore } from '../stores/socketStore';

export function StatusBar() {
  const activeOperatorId = useAppStore((s) => s.activeOperatorId);
  const stenographers = useAppStore((s) => s.stenographers);
  const connectionStatus = useSocketStore((s) => s.connectionStatus);
  const onlineMembers = useSocketStore((s) => s.onlineMembers);
  const lastCaption = useSocketStore((s) => s.lastCaption);
  const [elapsed, setElapsed] = useState(0);
  const [latency, setLatency] = useState<number | null>(null);

  // 자막 지연 시간 계산
  useEffect(() => {
    if (lastCaption?.timestamp) {
      setLatency(Date.now() - lastCaption.timestamp);
    }
  }, [lastCaption]);

  // 세션 타이머
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeStenographer = stenographers.find((s) => s.id === activeOperatorId);

  const statusConfig: Record<string, { color: string; label: string }> = {
    connected: { color: 'bg-active-operator', label: '온라인' },
    connecting: { color: 'bg-yellow-400', label: '연결 중...' },
    reconnecting: { color: 'bg-yellow-400', label: '재연결 중...' },
    disconnected: { color: 'bg-accent', label: '로컬 모드' },
  };

  const status = statusConfig[connectionStatus] || statusConfig.disconnected;

  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-border-subtle bg-surface-1 px-5 py-1.5">
      {/* 송출 상태 */}
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-active-operator" />
        <span className="min-w-0 text-[11px] text-text-muted">
          송출: <span className="font-semibold text-active-operator">{activeStenographer?.name ?? activeOperatorId}</span>
        </span>
      </div>

      {/* 구분점 */}
      <span className="text-[11px] text-border-subtle">|</span>

      {/* 연결 상태 */}
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${status.color}`} />
        <span className="text-[11px] text-text-muted">{status.label}</span>
      </div>

      <span className="text-[11px] text-border-subtle">|</span>

      {/* 자막 지연 시간 (세션 모드) */}
      {latency !== null && onlineMembers.length > 0 && (
        <>
          <span className="text-[11px] text-border-subtle">|</span>
          <span className={`text-[11px] ${latency > 200 ? 'text-yellow-400' : 'text-text-muted'}`}>
            지연: {latency}ms
          </span>
        </>
      )}

      <span className="text-[11px] text-border-subtle">|</span>

      {/* 접속자 수 */}
      <span className="text-[11px] text-text-muted">
        {onlineMembers.length > 0
          ? `접속자 ${onlineMembers.length}명`
          : `속기사 ${stenographers.length}명`
        }
      </span>

      {/* 세션 시간 (우측) */}
      <div className="ml-auto text-[11px] font-mono text-text-muted">
        {formatTime(elapsed)}
      </div>
    </div>
  );
}
