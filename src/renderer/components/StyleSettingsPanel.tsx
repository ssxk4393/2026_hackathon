import { useCallback, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { STYLE_PRESETS } from '../../shared/types';
import type { CaptionStyle } from '../../shared/types';

const FONT_OPTIONS = [
  { label: '── 한글 폰트 ──', value: '', disabled: true },
  { label: 'Noto Sans KR', value: 'Noto Sans KR, sans-serif' },
  { label: '맑은 고딕', value: 'Malgun Gothic, sans-serif' },
  { label: '나눔고딕', value: 'Nanum Gothic, sans-serif' },
  { label: '나눔명조', value: 'Nanum Myeongjo, serif' },
  { label: '바탕', value: 'Batang, serif' },
  { label: '굴림', value: 'Gulim, sans-serif' },
  { label: '돋움', value: 'Dotum, sans-serif' },
  { label: '── 기본 폰트 ──', value: '', disabled: true },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

interface StyleSettingsPanelProps {
  onClose: () => void;
  width?: number;
}

export function StyleSettingsPanel({ onClose, width = 320 }: StyleSettingsPanelProps) {
  const captionStyle = useAppStore((s) => s.captionStyle);
  const updateStyle = useAppStore((s) => s.updateStyle);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedUpdate = useCallback(
    (partial: Partial<CaptionStyle>) => {
      updateStyle(partial);
    },
    [updateStyle],
  );

  const handleSliderChange = useCallback(
    (key: keyof CaptionStyle, value: number) => {
      const store = useAppStore.getState();
      const newStyle = { ...store.captionStyle, [key]: value };
      useAppStore.setState({ captionStyle: newStyle });

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        window.electronAPI.updateStyle(newStyle);
      }, 100);
    },
    [],
  );

  const applyPreset = useCallback(
    (presetStyle: CaptionStyle) => {
      useAppStore.setState({ captionStyle: presetStyle });
      window.electronAPI.updateStyle(presetStyle);
    },
    [],
  );

  return (
    <div className="flex h-full flex-col border-l border-border-subtle bg-surface-1" style={{ width: `${width}px` }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-xs font-bold text-text-primary">자막 스타일 설정</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-text-muted hover:bg-surface-3 hover:text-text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 프리셋 */}
        <Section title="프리셋">
          <div className="flex flex-wrap gap-1.5">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.style)}
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs text-text-secondary transition-all hover:border-accent hover:bg-accent/10 hover:text-accent"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </Section>

        {/* 폰트 */}
        <Section title="폰트">
          <select
            value={captionStyle.fontFamily}
            onChange={(e) => debouncedUpdate({ fontFamily: e.target.value })}
            className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            {FONT_OPTIONS.map((f, i) =>
              f.disabled ? (
                <option key={i} disabled value="">
                  {f.label}
                </option>
              ) : (
                <option key={i} value={f.value}>
                  {f.label}
                </option>
              ),
            )}
          </select>
        </Section>

        {/* 글자 크기 */}
        <Section title={`글자 크기 · ${captionStyle.fontSize}px`}>
          <input
            type="range"
            min={24}
            max={96}
            step={2}
            value={captionStyle.fontSize}
            onChange={(e) => handleSliderChange('fontSize', Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>24</span>
            <span>96</span>
          </div>
        </Section>

        {/* 글자색 */}
        <Section title="글자색">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={captionStyle.fontColor}
                onChange={(e) => debouncedUpdate({ fontColor: e.target.value })}
                className="h-9 w-14 cursor-pointer rounded-lg border border-border-subtle bg-transparent"
              />
            </div>
            <span className="rounded bg-surface-2 px-2 py-1 font-mono text-xs text-text-muted">
              {captionStyle.fontColor}
            </span>
          </div>
        </Section>

        {/* 배경색 + 투명도 */}
        <Section title="배경">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={captionStyle.bgColor}
              onChange={(e) => debouncedUpdate({ bgColor: e.target.value })}
              className="h-9 w-14 cursor-pointer rounded-lg border border-border-subtle bg-transparent"
            />
            <span className="rounded bg-surface-2 px-2 py-1 font-mono text-xs text-text-muted">
              {captionStyle.bgColor}
            </span>
          </div>
          <div className="mt-3">
            <label className="text-[10px] text-text-muted">
              투명도 · {Math.round(captionStyle.bgOpacity * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={captionStyle.bgOpacity}
              onChange={(e) => handleSliderChange('bgOpacity', Number(e.target.value))}
              className="w-full"
            />
          </div>
        </Section>

        {/* 텍스트 정렬 */}
        <Section title="텍스트 정렬">
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => debouncedUpdate({ textAlign: align })}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  captionStyle.textAlign === align
                    ? 'bg-accent text-white shadow-glow-accent'
                    : 'bg-surface-2 text-text-muted hover:bg-surface-3 hover:text-text-secondary'
                }`}
              >
                {align === 'left' ? '좌측' : align === 'center' ? '가운데' : '우측'}
              </button>
            ))}
          </div>
        </Section>

        {/* 자막 위치 */}
        <Section title="자막 위치">
          <div className="flex gap-1">
            {(['top', 'middle', 'bottom'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => debouncedUpdate({ position: pos })}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  captionStyle.position === pos
                    ? 'bg-accent text-white shadow-glow-accent'
                    : 'bg-surface-2 text-text-muted hover:bg-surface-3 hover:text-text-secondary'
                }`}
              >
                {pos === 'top' ? '상단' : pos === 'middle' ? '중앙' : '하단'}
              </button>
            ))}
          </div>
        </Section>

        {/* 줄 간격 */}
        <Section title={`줄 간격 · ${captionStyle.lineHeight.toFixed(1)}`}>
          <input
            type="range"
            min={1.0}
            max={2.0}
            step={0.1}
            value={captionStyle.lineHeight}
            onChange={(e) => handleSliderChange('lineHeight', Number(e.target.value))}
            className="w-full"
          />
        </Section>

        {/* 자간 */}
        <Section title={`자간 · ${captionStyle.letterSpacing}px`}>
          <input
            type="range"
            min={-2}
            max={5}
            step={0.5}
            value={captionStyle.letterSpacing}
            onChange={(e) => handleSliderChange('letterSpacing', Number(e.target.value))}
            className="w-full"
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </label>
      {children}
    </div>
  );
}
