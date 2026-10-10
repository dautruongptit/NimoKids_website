import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router';
import Button from './Button';
import { ApiError } from '../api/apiClient';
import {
  REFRESH_MARGIN_SECONDS, forgetAccessToken, googleStartUrl, listDevices, probeSession, refreshSession, revokeDevice,
  safeReturnTo, signOut as signOutRequest, signOutEverywhere, type DeviceSession, type TokenResponse, type UserInfo,
} from '../api/authApi';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * The OPTIONAL account (Sign in with Google). Playing never depends on it: whatever happens here (Google off, network
 * down, session ended) the child keeps playing anonymously. Only a short, friendly notice is ever shown.
 */
type Dialog = 'intro' | 'loading' | 'cancelled' | 'error' | 'disabled' | 'unavailable' | 'profile';
type Status = 'checking' | 'anonymous' | 'signedIn';

type AccountContextValue = {
  status: Status;
  signedIn: boolean;
  /** Google is configured on the server; without it no sign-in button is shown at all. */
  available: boolean;
  user: UserInfo | null;
  open: () => void;
  profile: () => void;
  signOut: () => void;
  /** Used by the landing pages after the Google redirect. */
  completeSignIn: () => Promise<boolean>;
  showError: (code: string | null) => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);
function useAccount() { const context = useContext(AccountContext); if (!context) throw new Error('Account provider missing'); return context; }

function GoogleLogo() {
  return <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.05 46.98 31.87 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}

/** Where the browser goes once the Google sign-in has succeeded. */
const AFTER_SIGN_IN_PATH = '/age';

const initialOf = (user: UserInfo | null) => (user?.displayName ?? user?.email ?? '?').trim().charAt(0).toUpperCase() || '?';
const firstNameOf = (user: UserInfo | null) => (user?.displayName ?? user?.email?.split('@')[0] ?? '').trim().split(/\s+/)[0] || '';

export function AccountEntry() {
  const account = useAccount();
  const { t } = useLanguage();
  const [menu, setMenu] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setMenu(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [menu]);

  // Always shown, signed in or not. While Google is unavailable the button still opens a dialog that says so.
  const name = firstNameOf(account.user) || t('authFriend');
  return <div className="account-area" ref={wrapper}>
    <Button variant="lavender" className="account-entry" onClick={() => account.signedIn ? setMenu(value => !value) : account.open()}
      aria-label={account.signedIn ? t('authMenuAria', { name }) : t('authSignInAria')} aria-expanded={account.signedIn ? menu : undefined}>
      {account.signedIn
        ? <>{account.user?.avatarUrl ? <img className="account-avatar account-avatar-img" src={account.user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : <span className="account-avatar">{initialOf(account.user)}</span>}<span className="account-label">{name} <span>⌄</span></span></>
        : <><img src="/assets/720c6.svg" className="design-icon" alt="" /><span className="account-label">{t('authSignIn')}</span></>}
    </Button>
    {menu && <div className="account-dropdown">
      <div className="account-menu-heading"><span className="account-avatar">{initialOf(account.user)}</span><div><strong>{t('authHi', { name })}</strong><span>{account.user?.email}</span></div></div>
      <button onClick={() => { setMenu(false); account.profile(); }}>{t('authMyAccount')} <span>→</span></button>
      <button onClick={() => { setMenu(false); account.signOut(); }}>{t('authSignOut')} <span>↗</span></button>
      <p>{t('authPlayOpen')}</p>
    </div>}
  </div>;
}

export function SaveProgressPrompt() {
  const account = useAccount();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || account.status !== 'anonymous' || !account.available) return null;
  return <aside className="save-progress-prompt" aria-label={t('authSignInAria')}>
    <button className="prompt-dismiss" onClick={() => setDismissed(true)} aria-label={t('authDismiss')}>×</button>
    <span className="save-prompt-star" aria-hidden="true">🌟</span>
    <div><strong>{t('authSavePromptTitle')}</strong><p>{t('authSavePromptText')}</p>
      <div className="save-prompt-actions"><button onClick={account.open}><GoogleLogo /> {t('authContinueGoogle')}</button><button onClick={() => setDismissed(true)}>{t('authMaybeLater')}</button></div></div>
  </aside>;
}

/** The two pages Google sends the browser back to: /auth/complete and /auth/error. */
export function AuthLanding({ kind }: { kind: 'complete' | 'error' }) {
  const account = useAccount();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;      // React strict mode runs effects twice in development
    done.current = true;
    if (kind === 'error') {
      account.showError(params.get('code'));
      navigate('/', { replace: true });
      return;
    }
    const target = safeReturnTo(params.get('returnTo'));
    void account.completeSignIn().then(ok => { if (!ok) account.showError('SIGN_IN_FAILED'); navigate(ok ? target : '/', { replace: true }); });
  }, [account, kind, navigate, params]);
  return <main className="auth-landing" role="status"><div className="auth-loading" aria-label={t('authSigningInPage')}><i /><i /><i /></div><p>{t('authSigningInPage')}</p></main>;
}

export default function AccountProvider({ children }: { children: ReactNode }) {
  const { t, uiLang } = useLanguage();
  const [status, setStatus] = useState<Status>('checking');
  const [available, setAvailable] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [devices, setDevices] = useState<DeviceSession[] | null>(null);
  const [devicesFailed, setDevicesFailed] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiresAt = useRef<number>(0);

  const announce = useCallback((text: string) => {
    setAnnouncement(text);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setAnnouncement(''), 5500);
  }, []);

  const becomeAnonymous = useCallback((toast?: string) => {
    forgetAccessToken();
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setUser(null); setDevices(null); setStatus('anonymous');
    if (toast) announce(toast);
  }, [announce]);

  /** Takes a token response: remembers the user and plans the next silent refresh. */
  const accept = useCallback((tokens: TokenResponse) => {
    setUser(tokens.user); setStatus('signedIn');
    expiresAt.current = Date.now() + tokens.expiresIn * 1000;
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const wait = Math.max(5, tokens.expiresIn - REFRESH_MARGIN_SECONDS) * 1000;
    refreshTimer.current = setTimeout(() => { void silentRefresh(); }, wait);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Renews the access token. A 401 means the session ended: sign out quietly. Network trouble changes nothing. */
  const silentRefresh = useCallback(async () => {
    try { accept(await refreshSession()); }
    catch (error) {
      if (error instanceof ApiError && error.httpStatus === 401) becomeAnonymous(t('authToastEnded'));
      else refreshTimer.current = setTimeout(() => { void silentRefresh(); }, 30_000);   // try again soon, keep the state
    }
  }, [accept, becomeAnonymous, t]);

  // On load: is there a session behind the cookie? (never an error for "no")
  useEffect(() => {
    let cancelled = false;
    probeSession()
      .then(async probe => {
        if (cancelled) return;
        setAvailable(probe.googleEnabled);
        if (probe.authenticated) {
          try { const tokens = await refreshSession(); if (!cancelled) accept(tokens); }
          catch { if (!cancelled) setStatus('anonymous'); }
        } else setStatus('anonymous');
      })
      .catch(() => { if (!cancelled) setStatus('anonymous'); });   // server unreachable: just stay anonymous
    return () => { cancelled = true; };
  }, [accept]);

  // Coming back to the tab after a long time: renew right away if the token is about to end.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && status === 'signedIn' && Date.now() > expiresAt.current - REFRESH_MARGIN_SECONDS * 1000) void silentRefresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [status, silentRefresh]);

  useEffect(() => () => { if (toastTimeout.current) clearTimeout(toastTimeout.current); if (refreshTimer.current) clearTimeout(refreshTimer.current); }, []);

  const open = useCallback((next: Dialog = 'intro') => { lastFocus.current = document.activeElement as HTMLElement; setDialog(next); }, []);
  const dismiss = useCallback(() => setDialog(null), []);

  function startGoogle() {
    setDialog('loading');
    // After a successful sign-in the child continues at the age screen (the start of the game flow).
    window.location.assign(googleStartUrl(AFTER_SIGN_IN_PATH));
  }

  const loadDevices = useCallback(async () => {
    setDevicesFailed(false);
    try { setDevices(await listDevices()); }
    catch (error) {
      if (error instanceof ApiError && error.httpStatus === 401) becomeAnonymous(t('authToastEnded'));
      else setDevicesFailed(true);
    }
  }, [becomeAnonymous, t]);

  const openProfile = useCallback(() => { open('profile'); void loadDevices(); }, [open, loadDevices]);

  const doSignOut = useCallback(async () => {
    try { await signOutRequest(); } catch { /* the cookie may already be gone: nothing more to do */ }
    setDialog(null);
    becomeAnonymous(t('authToastOut'));
  }, [becomeAnonymous, t]);

  async function signOutAll() {
    try { await signOutEverywhere(); } catch { /* ignore: the local state is reset anyway */ }
    setDialog(null);
    becomeAnonymous(t('authToastAll'));
  }

  async function removeDevice(id: string) {
    try { await revokeDevice(id); await loadDevices(); } catch (error) {
      if (error instanceof ApiError && error.httpStatus === 401) becomeAnonymous(t('authToastEnded')); else setDevicesFailed(true);
    }
  }

  const completeSignIn = useCallback(async () => {
    try { accept(await refreshSession()); return true; } catch { return false; }
  }, [accept]);

  const showError = useCallback((code: string | null) => {
    const next: Dialog = code === 'OAUTH_CANCELLED' ? 'cancelled' : code === 'ACCOUNT_DISABLED' ? 'disabled' : code === 'OAUTH_UNAVAILABLE' ? 'unavailable' : 'error';
    open(next);
  }, [open]);

  // Modal behaviour: focus trap, Escape, background inert, scroll lock
  useEffect(() => {
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const app = document.querySelector('.nimo-app') as HTMLElement | null;
    if (app) app.inert = true;
    const focusTimer = setTimeout(() => dialogRef.current?.focus(), 0);
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
      if (event.key !== 'Tab') return;
      const targets = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]') || []);
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { clearTimeout(focusTimer); document.body.style.overflow = previousOverflow; if (app) app.inert = false; document.removeEventListener('keydown', keyboard); lastFocus.current?.focus(); };
  }, [dialog, dismiss]);

  const name = firstNameOf(user) || t('authFriend');
  const content = (() => {
    switch (dialog) {
      case 'loading': return { title: t('authLoadingTitle'), description: t('authLoadingText'), art: '🌟' };
      case 'cancelled': return { title: t('authCancelledTitle'), description: t('authCancelledText'), art: '🌈' };
      case 'error': return { title: t('authErrorTitle'), description: t('authErrorText'), art: '☁️' };
      case 'disabled': return { title: t('authDisabledTitle'), description: t('authDisabledText'), art: '☁️' };
      case 'unavailable': return { title: t('authErrorTitle'), description: t('authUnavailableText'), art: '☁️' };
      case 'profile': return { title: t('authProfileTitle'), description: t('authProfileText'), art: '🌟' };
      default: return { title: t('authIntroTitle'), description: t('authIntroText'), art: '🌈' };
    }
  })();
  const retryable = dialog === 'intro' || dialog === 'cancelled' || dialog === 'error';

  const value: AccountContextValue = {
    status, signedIn: status === 'signedIn', available, user, open: () => open(available ? 'intro' : 'unavailable'), profile: openProfile,
    signOut: () => { void doSignOut(); }, completeSignIn, showError,
  };

  return <AccountContext.Provider value={value}>
    {children}
    {announcement && <div className="account-toast" role="status">{announcement}</div>}
    {dialog && createPortal(
      <div className="auth-backdrop" onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
        <div className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-description" tabIndex={-1} ref={dialogRef}>
          <button className="auth-close" onClick={dismiss} aria-label={t('authClose')}>×</button>
          <span className="auth-kicker">{dialog === 'profile' ? t('authKickerCorner') : t('authKicker')}</span>
          <div className={`auth-art ${dialog === 'loading' ? 'auth-loading-art' : ''}`}><span aria-hidden="true">✦</span><div>{content.art}</div><span aria-hidden="true">✧</span></div>
          <h1 id="auth-title">{content.title}</h1>
          <p id="auth-description">{content.description}</p>
          {dialog === 'intro' && <div className="auth-benefits">{t('authBenefits').split('|').map(label => <span key={label}>{label}</span>)}</div>}
          {dialog === 'loading' && <div className="auth-loading" role="status" aria-label={t('authLoadingTitle')}><i /><i /><i /></div>}
          {dialog === 'profile' && <>
            <div className="preview-profile">
              {user?.avatarUrl ? <img className="account-avatar account-avatar-img" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : <span className="account-avatar">{initialOf(user)}</span>}
              <div><strong>{user?.displayName ?? name}</strong><span>{user?.email}</span></div><span className="profile-check">✓</span>
            </div>
            <section className="device-section" aria-labelledby="devices-title">
              <h2 id="devices-title">{t('authDevices')}</h2>
              {devicesFailed && <p className="device-error" role="alert">{t('authDevicesError')}</p>}
              {devices && !devicesFailed && <ul className="device-list">{devices.map(device => <li key={device.id} className={device.current ? 'device-current' : ''}>
                <span className="device-icon" aria-hidden="true">{device.deviceType === 'MOBILE' ? '📱' : device.deviceType === 'TABLET' ? '📲' : '💻'}</span>
                <div><strong>{[device.browser, device.os].filter(Boolean).join(' · ') || '—'}</strong>
                  <small>{device.current ? t('authThisDevice') + ' · ' : ''}{t('authSeen', { when: new Date(device.lastSeenAt).toLocaleString(uiLang === 'vi' ? 'vi-VN' : 'en-US') })}{device.ipMasked ? ` · ${device.ipMasked}` : ''}</small></div>
                {!device.current && <button onClick={() => void removeDevice(device.id)}>{t('authSignOutDevice')}</button>}
              </li>)}</ul>}
              {devices && devices.length <= 1 && !devicesFailed && <p className="device-empty">{t('authNoDevices')}</p>}
              <div className="device-actions"><button onClick={() => void doSignOut()}>{t('authSignOut')}</button><button onClick={() => void signOutAll()}>{t('authSignOutAll')}</button></div>
            </section>
          </>}
          {retryable && <Button variant="blue" className="google-button" onClick={startGoogle}><GoogleLogo />{dialog === 'error' ? t('authTryAgainGoogle') : t('authContinueGoogle')}</Button>}
          {dialog === 'profile'
            ? <Button className="auth-play" onClick={dismiss}>{t('authBack')}</Button>
            : <Button variant="lavender" className="auth-skip" onClick={dismiss}>{dialog === 'loading' ? t('authCancelKeep') : t('authSkip')}</Button>}
          <p className="auth-reassurance">{dialog === 'profile' ? t('authReassureIn') : t('authReassure')}</p>
        </div>
      </div>, document.body)}
  </AccountContext.Provider>;
}
