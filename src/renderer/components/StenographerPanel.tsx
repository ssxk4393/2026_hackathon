import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import type { Stenographer } from '../../shared/types';

interface StenographerPanelProps {
  stenographer: Stenographer;
}

export function StenographerPanel({ stenographer }: StenographerPanelProps) {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeOperatorId = useAppStore((s) => s.activeOperatorId);
  const updateCaptionText = useAppStore((s) => s.updateCaptionText);

  const isOperator = activeOperatorId === stenographer.id;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (inputText.trim()) {
          updateCaptionText(stenographer.id, inputText.trim());
          setInputText('');
        }
      }
    },
    [inputText, stenographer.id, updateCaptionText],
  );

  useEffect(() => {
    if (isOperator && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOperator]);

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col rounded-xl border p-4 transition-all duration-300 ${
        isOperator
          ? 'border-active-operator/60 bg-surface-2 shadow-glow-green'
          : 'border-border-subtle bg-surface-1 hover:border-border-subtle/80'
      }`}
    >
      {/* 헤더 */}
      <div className="mb-3 flex items-center gap-3">
        {/* 아바타 */}
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
            isOperator
              ? 'bg-active-operator text-white'
              : 'bg-surface-3 text-text-secondary'
          }`}
        >
          {stenographer.id}
        </div>

        <div className="flex-1">
          <span className="text-sm font-semibold text-text-primary">
            {stenographer.name}
          </span>
        </div>

        {/* 송출 상태 뱃지 */}
        {isOperator ? (
          <div className="flex items-center gap-1.5 rounded-full bg-active-operator/15 px-3 py-1">
            <span className="h-2 w-2 animate-pulse-slow rounded-full bg-active-operator" />
            <span className="text-xs font-semibold text-active-operator">
              LIVE
            </span>
          </div>
        ) : (
          <span className="rounded-full bg-surface-3 px-3 py-1 text-xs text-text-muted">
            대기
          </span>
        )}
      </div>

      {/* 입력창 — flex-1로 남은 세로 공간 모두 차지 */}
      <textarea
        ref={inputRef}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isOperator
            ? '자막을 입력하세요... (Enter로 송출)'
            : '대기 중... (송출 전환 후 입력 가능)'
        }
        className={`min-h-[60px] w-full flex-1 resize-none rounded-lg border px-4 py-3 text-sm transition-all focus:outline-none ${
          isOperator
            ? 'border-active-operator/30 bg-surface-0 text-text-primary placeholder-text-muted focus:border-active-operator/60 focus:shadow-glow-green'
            : 'border-border-subtle bg-surface-0/50 text-text-secondary placeholder-text-muted/60 focus:border-text-muted'
        }`}
      />

      {/* 글자 수 카운터 */}
      {inputText.length > 0 && (
        <div className="mt-1.5 text-right text-xs text-text-muted">
          {inputText.length}자
        </div>
      )}
    </div>
  );
}
