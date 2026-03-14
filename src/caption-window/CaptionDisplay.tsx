import { useState, useEffect, useRef } from 'react';
import type { CaptionStyle } from '../shared/types';
import { DEFAULT_CAPTION_STYLE } from '../shared/types';

export function CaptionDisplay() {
  const [text, setText] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [style, setStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
  const [isLocked, setIsLocked] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const unsubCaption = window.electronAPI.onCaptionUpdate((newText) => {
      setText(newText);
    });
    const unsubStyle = window.electronAPI.onStyleUpdate((newStyle) => {
      setStyle(newStyle);
    });
    return () => {
      unsubCaption();
      unsubStyle();
    };
  }, []);

  // 자막 fade 애니메이션
  useEffect(() => {
    if (text) {
      setDisplayText(text);
      setIsVisible(true);
    } else {
      setIsVisible(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setDisplayText(''), 300);
    }
  }, [text]);

  // Escape로 잠금 토글
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLocked((prev) => !prev);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const positionStyle =
    style.position === 'top'
      ? 'justify-start pt-8'
      : style.position === 'middle'
        ? 'justify-center'
        : 'justify-end pb-8';

  return (
    <div
      className={`flex h-screen w-screen flex-col items-center ${positionStyle}`}
      style={{
        WebkitAppRegion: isLocked ? 'no-drag' : 'drag',
        cursor: isLocked ? 'default' : 'move',
      } as React.CSSProperties}
    >
      {/* 컨트롤 바 (잠금 해제 시 표시) */}
      {!isLocked && (
        <div
          className="absolute left-3 right-3 top-3 flex items-center justify-between"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <div className="rounded-md bg-black/40 px-2.5 py-1 text-xs text-white/50 backdrop-blur-sm">
            드래그 이동 | ESC 잠금
          </div>
          <button
            onClick={() => window.electronAPI.closeCaptionWindow()}
            className="rounded-md bg-red-500/60 px-2.5 py-1 text-xs text-white transition-colors hover:bg-red-500"
          >
            닫기
          </button>
        </div>
      )}

      {/* 자막 텍스트 — no-drag 제거하여 텍스트 위에서도 드래그 가능 */}
      <div
        className="w-full px-6"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
      >
        <div
          className="rounded-xl px-8 py-5"
          style={{
            fontFamily: style.fontFamily,
            fontSize: `${style.fontSize}px`,
            color: style.fontColor,
            backgroundColor: displayText
              ? `${style.bgColor}${Math.round(style.bgOpacity * 255)
                  .toString(16)
                  .padStart(2, '0')}`
              : 'transparent',
            textAlign: style.textAlign,
            lineHeight: style.lineHeight,
            letterSpacing: `${style.letterSpacing ?? 0}px`,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          {displayText || '\u00A0'}
        </div>
      </div>

      {/* 리사이즈 힌트 */}
      {!isLocked && (
        <div className="pointer-events-none absolute inset-0 rounded-lg border border-dashed border-white/20" />
      )}
    </div>
  );
}
