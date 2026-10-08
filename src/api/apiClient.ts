/**
 * Single entry point to the NimoKids backend (Spring Boot, /api/v1).
 *
 * - Relative URLs only (Vite proxies /api in dev, nginx in Docker), so no CORS in production.
 * - Every request carries X-Anonymous-Id (UUID kept in localStorage, created on first use).
 * - The backend wraps every answer in { status, message, data, error, requestId, timestamp }; this client unwraps it
 *   and throws ApiError with the stable machine-readable error code on failure.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/v1';
const TIMEOUT_MS = 10_000;
const ANONYMOUS_ID_KEY = 'nimokids_anonymous_id';

export const ANONYMOUS_ID_HEADER = 'X-Anonymous-Id';

type Envelope<T> = {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data: T | null;
  error?: { code: string; details?: unknown };
  requestId?: string;
};

export class ApiError extends Error {
  /** Backend ErrorCode (e.g. TOPIC_NOT_PLAYABLE), or NETWORK_ERROR / TIMEOUT / BAD_RESPONSE for client-side failures. */
  readonly code: string;
  readonly httpStatus: number;
  readonly requestId?: string;
  constructor(code: string, message: string, httpStatus = 0, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.requestId = requestId;
  }
}

function uuid(): string {
  const webCrypto = globalThis.crypto as Crypto | undefined;
  if (typeof webCrypto?.randomUUID === 'function') return webCrypto.randomUUID();
  // Fallback for non-secure contexts (plain http on a LAN device): RFC 4122 v4.
  const bytes = new Uint8Array(16);
  if (webCrypto?.getRandomValues) webCrypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let memoryId: string | null = null; // used when localStorage is blocked (private mode)

/** Anonymous player id. Created once, then reused on every request and every visit. Identifier only, not a credential. */
export function getAnonymousId(): string {
  try {
    const stored = localStorage.getItem(ANONYMOUS_ID_KEY);
    if (stored && UUID_PATTERN.test(stored)) return stored;
    const created = uuid();
    localStorage.setItem(ANONYMOUS_ID_KEY, created);
    return created;
  } catch {
    return (memoryId ??= uuid());
  }
}

type RequestOptions = { method?: 'GET' | 'POST'; body?: unknown; signal?: AbortSignal };

export async function request<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, TIMEOUT_MS);
  // Honour the caller's cancellation (e.g. a component unmounting) as well as our own timeout.
  signal?.addEventListener('abort', () => controller.abort(), { once: true });

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        [ANONYMOUS_ID_HEADER]: getAnonymousId(),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let envelope: Envelope<T> | null = null;
    try { envelope = (await response.json()) as Envelope<T>; } catch { /* not JSON (proxy error page, 502 ...) */ }

    if (!response.ok || envelope?.status === 'ERROR') {
      throw new ApiError(
        envelope?.error?.code ?? `HTTP_${response.status}`,
        envelope?.message ?? response.statusText,
        response.status,
        envelope?.requestId,
      );
    }
    if (!envelope) throw new ApiError('BAD_RESPONSE', 'The server sent an unreadable answer', response.status);
    return envelope.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal?.aborted) throw error; // caller cancelled: let it handle the AbortError silently
    if (timedOut) throw new ApiError('TIMEOUT', 'The server took too long to answer');
    throw new ApiError('NETWORK_ERROR', 'Could not reach the server');
  } finally {
    clearTimeout(timer);
  }
}

export const apiGet = <T,>(path: string, signal?: AbortSignal) => request<T>(path, { signal });
export const apiPost = <T,>(path: string, body?: unknown, signal?: AbortSignal) => request<T>(path, { method: 'POST', body, signal });

export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
