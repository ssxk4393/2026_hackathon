import { useState, useEffect, useCallback } from 'react';
import type { SessionInfo } from '../../shared/types';

const API_BASE = 'http://localhost:3000';

interface SessionLobbyProps {
  token: string;
  userName: string;
  userAvatar: string;
  onJoinSession: (session: SessionInfo) => void;
  onLogout: () => void;
}

export function SessionLobby({
  token,
  userName,
  userAvatar,
  onJoinSession,
  onLogout,
}: SessionLobbyProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 새 세션 생성 폼
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [maxOperators, setMaxOperators] = useState(2);
  const [isCreating, setIsCreating] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions`, { headers });
      if (!res.ok) throw new Error('세션 목록 조회 실패');
      const data = await res.json();
      setSessions(data);
    } catch {
      setError('세션 목록을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setIsCreating(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: trimmed, maxOperators }),
      });

      if (!res.ok) throw new Error('세션 생성 실패');

      const session: SessionInfo = await res.json();
      onJoinSession(session);
    } catch {
      setError('세션 생성에 실패했습니다');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (sessionId: string) => {
    setError('');

    try {
      // 참가 요청
      const joinRes = await fetch(`${API_BASE}/sessions/${sessionId}/join`, {
        method: 'POST',
        headers,
      });
      if (!joinRes.ok) throw new Error('세션 참가 실패');

      // 세션 상세 조회
      const detailRes = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        headers,
      });
      if (!detailRes.ok) throw new Error('세션 조회 실패');

      const session: SessionInfo = await detailRes.json();
      onJoinSession(session);
    } catch {
      setError('세션 참가에 실패했습니다');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-surface-0">
      {/* 헤더 */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-1 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
          <span className="text-sm font-bold text-accent">RC</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-text-primary">Realtime Caption Studio</h1>
          <p className="text-xs text-text-muted">세션 로비</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="h-6 w-6 rounded-full" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                {userName[0]}
              </div>
            )}
            <span className="text-sm text-text-primary">{userName}</span>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg px-2.5 py-1 text-xs text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto p-8">
        <div className="w-full max-w-2xl">
          {/* 타이틀 + 새 세션 버튼 */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">활성 세션</h2>
            <div className="flex gap-2">
              <button
                onClick={fetchSessions}
                className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-2"
              >
                새로고침
              </button>
              <button
                onClick={() => setShowCreate((v) => !v)}
                className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110"
              >
                {showCreate ? '취소' : '새 세션'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* 새 세션 생성 폼 */}
          {showCreate && (
            <div className="mb-6 rounded-xl border border-accent/30 bg-surface-1 p-5">
              <h3 className="mb-4 text-sm font-semibold text-text-primary">새 세션 만들기</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">세션 이름</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="예: 3월 15일 세미나 자막"
                    maxLength={50}
                    autoFocus
                    className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder-text-muted/50 outline-none transition-colors focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">최대 송출자 수</label>
                  <select
                    value={maxOperators}
                    onChange={(e) => setMaxOperators(Number(e.target.value))}
                    className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>{n}명</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !newName.trim()}
                  className="mt-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {isCreating ? '생성 중...' : '세션 생성'}
                </button>
              </div>
            </div>
          )}

          {/* 세션 목록 */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-text-muted">세션 목록 로딩 중...</div>
          ) : sessions.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-surface-1 py-12 text-center">
              <p className="text-sm text-text-muted">활성 세션이 없습니다</p>
              <p className="mt-1 text-xs text-text-muted/60">새 세션을 만들어 시작하세요</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface-1 p-4 transition-colors hover:border-accent/30"
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary">{session.name}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                      <span>생성: {session.creator.name}</span>
                      <span>참가자: {session.members.filter((m) => !m.leftAt).length}명</span>
                      <span>최대 송출: {session.maxOperators}명</span>
                    </div>
                    {/* 멤버 아바타 */}
                    <div className="mt-2 flex gap-1">
                      {session.members
                        .filter((m) => !m.leftAt)
                        .map((m) => (
                          <div
                            key={m.id}
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                              m.role === 'operator'
                                ? 'bg-active-operator/20 text-active-operator'
                                : 'bg-surface-3 text-text-muted'
                            }`}
                            title={`${m.user.name} (${m.role})`}
                          >
                            {m.user.name[0]}
                          </div>
                        ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoin(session.id)}
                    className="shrink-0 rounded-lg bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                  >
                    참가
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
