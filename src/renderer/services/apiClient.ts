const API_BASE = 'http://localhost:3000';

type LogoutCallback = () => void;
let onUnauthorized: LogoutCallback | null = null;

export function setUnauthorizedHandler(handler: LogoutCallback): void {
  onUnauthorized = handler;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `요청 실패 (${res.status})`);
  }

  // Handle empty responses
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}
