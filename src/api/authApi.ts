import { ApiError, request } from './apiClient';

/**
 * The optional account system (Sign in with Google). Playing never needs it.
 *
 * - The refresh token lives in an HttpOnly cookie: JavaScript cannot read it. It is sent only to /api/v1/auth/*.
 * - The access token (15 min) lives in memory ONLY: never localStorage, never sessionStorage. A reload simply
 *   gets a new one through the cookie.
 * - Refresh is single-flight: any number of callers share one request. A request is retried at most once.
 */
export type UserInfo = { id: string; type: 'ADMIN' | 'USER'; role: string; email: string | null; displayName: string | null; avatarUrl: string | null };
export type SessionInfo = { id: string; expiresAt: string; idleExpiresAt: string };
export type TokenResponse = { accessToken: string; tokenType: string; expiresIn: number; session: SessionInfo; user: UserInfo };
export type SessionProbe = { authenticated: boolean; user: UserInfo | null; session: SessionInfo | null; googleEnabled: boolean };
export type DeviceSession = {
  id: string; current: boolean; createdAt: string; lastSeenAt: string; expiresAt: string;
  ipMasked: string | null; browser: string | null; os: string | null; deviceType: string | null;
};

/** Sent on the two cookie endpoints: a header another site cannot add without a CORS pre-flight (CSRF defence). */
const COOKIE_HEADERS = { 'X-NK-Requested-With': 'web' };

let accessToken: string | null = null;
let inFlight: Promise<TokenResponse> | null = null;

export const hasAccessToken = () => accessToken !== null;
export const forgetAccessToken = () => { accessToken = null; };
const bearer = (): Record<string, string> => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {});

/** Exchanges the refresh cookie for a new access token (and a rotated cookie). Safe to call from many places. */
export function refreshSession(): Promise<TokenResponse> {
  inFlight ??= request<TokenResponse>('/auth/refresh', { method: 'POST', headers: COOKIE_HEADERS })
    .then(tokens => { accessToken = tokens.accessToken; return tokens; })
    .catch(error => { if (error instanceof ApiError && error.httpStatus === 401) accessToken = null; throw error; })
    .finally(() => { inFlight = null; });
  return inFlight;
}

/** Is there a live session behind the cookie? Never an error for "no". */
export const probeSession = () => request<SessionProbe>('/auth/session');

/** A call with the Bearer token. If the token has just expired, it is refreshed and the call is repeated ONCE. */
async function authed<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const call = () => request<T>(path, { method, body, headers: bearer() });
  if (!accessToken) await refreshSession();
  try {
    return await call();
  } catch (error) {
    if (error instanceof ApiError && error.code === 'TOKEN_EXPIRED') {
      await refreshSession();
      return call();
    }
    throw error;
  }
}

export const listDevices = () => authed<DeviceSession[]>('GET', '/auth/sessions');
export const revokeDevice = (sessionId: string) => authed<void>('DELETE', `/auth/sessions/${sessionId}`);
export const signOutEverywhere = () => authed<{ revoked: number }>('POST', '/auth/logout-all', { keepCurrent: false });

/** Ends this session on the server (the cookie alone is enough), then forgets the token. */
export async function signOut(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST', headers: { ...COOKIE_HEADERS, ...bearer() } });
  } finally {
    accessToken = null;
  }
}

/** Where the browser goes to start the Google sign-in. A full navigation: Google leaves no other option. */
export const googleStartUrl = (returnTo: string) => `/api/v1/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;

/** The page to return to after sign-in: only a path of this site, never another address. */
export function safeReturnTo(value: string | null): string {
  // Browsers drop tabs/newlines inside URLs, so "/\t/evil.com" would turn into "//evil.com": refuse control characters too.
  if (!value || /[\u0000-\u001F\u007F\\]/.test(value) || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

/** The token refreshes itself about a minute before it ends. */
export const REFRESH_MARGIN_SECONDS = 60;
