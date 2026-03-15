import { useSocketStore } from '../stores/socketStore';

interface RemoteOperatorPanelProps {
  userId: string;
  name: string;
}

export function RemoteOperatorPanel({ userId, name }: RemoteOperatorPanelProps) {
  const caption = useSocketStore((s) => s.captionsByUser[userId]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col rounded-xl border border-active-operator/30 bg-surface-1 p-4 transition-all duration-300">
      {/* 헤더 */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-active-operator/20 text-sm font-bold text-active-operator">
          {name[0]}
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold text-text-primary">{name}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-active-operator/15 px-3 py-1">
          <span className="h-2 w-2 animate-pulse-slow rounded-full bg-active-operator" />
          <span className="text-xs font-semibold text-active-operator">LIVE</span>
        </div>
      </div>

      {/* 수신된 자막 표시 (읽기 전용) */}
      <div className="min-h-[60px] w-full flex-1 rounded-lg border border-border-subtle bg-surface-0/50 px-4 py-3">
        {caption ? (
          <p className="text-sm text-text-primary">{caption.text}</p>
        ) : (
          <p className="text-sm text-text-muted/50">아직 송출된 자막이 없습니다</p>
        )}
      </div>
    </div>
  );
}
