import { useState } from 'react';

interface LoginPageProps {
  onLogin: (token: string, name: string, avatar: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGuestLogin = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('닉네임을 입력해주세요');
      return;
    }
    if (trimmed.length < 2) {
      setError('2자 이상 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3000/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) throw new Error('로그인 실패');

      const data = await res.json();
      onLogin(data.token, data.user.name, data.user.avatar || '');
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGuestLogin();
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-surface-0">
      {/* 로고 */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
          <span className="text-2xl font-bold text-accent">RC</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          Realtime Caption Studio
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          실시간 자막 송출 서비스
        </p>
      </div>

      {/* 게스트 로그인 */}
      <div className="flex w-80 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-primary">
            닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="사용할 닉네임을 입력하세요"
            maxLength={20}
            autoFocus
            className="rounded-xl border border-border-subtle bg-surface-2 px-4 py-3 text-sm text-text-primary placeholder-text-muted/50 outline-none transition-colors focus:border-accent"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={isLoading}
          className="rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
        >
          {isLoading ? '접속 중...' : '시작하기'}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs text-text-muted">SNS 로그인</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        <div className="flex gap-2">
          <button
            disabled
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium opacity-40"
            style={{ backgroundColor: '#FEE500', color: '#191919' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.636 4.03 5.87-.163.6-.583 2.17-.667 2.51-.103.42.154.414.324.3.133-.09 2.11-1.44 2.97-2.03.43.06.87.1 1.34.1 5.523 0 10-3.477 10-7.75S17.523 3 12 3z"/>
            </svg>
            카카오 (준비 중)
          </button>
          <button
            disabled
            className="flex-1 rounded-xl border border-border-subtle bg-surface-2 px-4 py-3 text-sm text-text-muted opacity-40"
          >
            네이버 (준비 중)
          </button>
        </div>
      </div>

      {/* 하단 */}
      <p className="mt-12 text-xs text-text-muted/50">
        v0.1 — 게스트 모드로 접속합니다
      </p>
    </div>
  );
}
