import { useState } from 'react';
import { useSocketStore } from '../stores/socketStore';
import { useAppStore } from '../stores/appStore';
import { requestOperator } from '../services/socketService';

export function StandbyPanel() {
  const lastCaption = useSocketStore((s) => s.lastCaption);
  const onlineMembers = useSocketStore((s) => s.onlineMembers);
  const currentSession = useAppStore((s) => s.currentSession);
  const [practiceText, setPracticeText] = useState('');

  const currentOperator = onlineMembers.find((m) => m.role === 'operator');

  const handleRequestOperator = () => {
    if (currentSession) {
      requestOperator(currentSession.id);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* 현재 자막 모니터링 */}
      <div className="flex flex-col rounded-xl border border-border-subtle bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse-slow rounded-full bg-active-operator" />
            <span className="text-xs font-semibold text-text-muted">
              현재 송출 중 — {currentOperator?.name || '없음'}
            </span>
          </div>
          <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-400">
            STANDBY
          </span>
        </div>
        <div className="min-h-[80px] rounded-lg bg-surface-0 p-4">
          {lastCaption ? (
            <p className="text-lg text-text-primary">{lastCaption.text}</p>
          ) : (
            <p className="text-sm text-text-muted/50">아직 송출된 자막이 없습니다</p>
          )}
        </div>
      </div>

      {/* 연습 입력 영역 */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border-subtle bg-surface-1 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted">연습 입력</span>
          <span className="text-xs text-text-muted/50">(송출되지 않습니다)</span>
        </div>
        <textarea
          value={practiceText}
          onChange={(e) => setPracticeText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setPracticeText('');
            }
          }}
          placeholder="연습 입력... (Enter로 초기화)"
          className="min-h-[60px] w-full flex-1 resize-none rounded-lg border border-border-subtle bg-surface-0/50 px-4 py-3 text-sm text-text-secondary placeholder-text-muted/60 focus:border-text-muted focus:outline-none"
        />
        {practiceText.length > 0 && (
          <div className="mt-1.5 text-right text-xs text-text-muted">
            {practiceText.length}자
          </div>
        )}
      </div>

      {/* 교대 요청 버튼 */}
      <button
        onClick={handleRequestOperator}
        className="shrink-0 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
      >
        송출 교대 요청
      </button>
    </div>
  );
}
