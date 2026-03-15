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
    const message = data.error || getDefaultErrorMessage(res.status);
    throw new Error(message);
  }

  // Handle empty responses
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400: return '입력 정보를 확인해주세요.';
    case 403: return '이 작업을 수행할 권한이 없습니다.';
    case 404: return '요청한 정보를 찾을 수 없습니다.';
    case 409: return '이미 처리된 요청입니다.';
    case 429: return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    case 500: return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    default: return `요청 처리 중 오류가 발생했습니다. (${status})`;
  }
}
