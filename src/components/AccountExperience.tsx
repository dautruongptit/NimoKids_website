import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

type AuthState = 'intro' | 'loading' | 'success' | 'cancelled' | 'error' | 'profile';
type AccountContextValue = { signedIn: boolean; open: () => void; signOut: () => void; profile: () => void; loading: boolean };
const AccountContext = createContext<AccountContextValue | null>(null);
function useAccount() { const context = useContext(AccountContext); if (!context) throw new Error('Account provider missing'); return context; }

function GoogleLogo() {
  return <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.05 46.98 31.87 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}

export function AccountEntry() {
  const account = useAccount();
  const [menu, setMenu] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setMenu(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [menu]);
  return <div className="account-area" ref={wrapper}><Button variant="lavender" className="account-entry" onClick={() => account.signedIn ? setMenu(value => !value) : account.open()} aria-label={account.signedIn ? 'Alex, preview account' : 'Sign in, optional'} aria-expanded={account.signedIn ? menu : undefined}>{account.signedIn ? <><span className="account-avatar">A</span><span className="account-label">Alex <span>⌄</span></span></> : <><img src="/assets/720c6.svg" className="design-icon" alt="" /><span className="account-label">{account.loading ? 'Signing in…' : 'Sign in'}</span></>}</Button>{menu && <div className="account-dropdown"><div className="account-menu-heading"><span className="account-avatar">A</span><div><strong>Hi, Alex! 👋</strong><span>Preview account</span></div></div><button onClick={() => { setMenu(false); account.profile(); }}>My account <span>→</span></button><button onClick={() => { setMenu(false); account.signOut(); }}>Sign out <span>↗</span></button><p>Play is always open to everyone. 💛</p></div>}</div>;
}

export function SaveProgressPrompt() {
  const account = useAccount();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || account.signedIn) return null;
  return <aside className="save-progress-prompt" aria-label="Optional sign in"><button className="prompt-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss sign-in suggestion">×</button><span className="save-prompt-star" aria-hidden="true">🌟</span><div><strong>Keep your little discoveries</strong><p>Want to save your progress? Signing in is optional.</p><div className="save-prompt-actions"><button onClick={account.open}><GoogleLogo /> Sign in with Google</button><button onClick={() => setDismissed(true)}>Maybe later</button></div></div></aside>;
}

export default function AccountProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [state, setState] = useState<AuthState | null>(null);
  const [previewTools, setPreviewTools] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  function announce(text: string) { setAnnouncement(text); if (toastTimeout.current) clearTimeout(toastTimeout.current); toastTimeout.current = setTimeout(() => setAnnouncement(''), 4500); }
  function open(next: AuthState = 'intro') { lastFocus.current = document.activeElement as HTMLElement; setPreviewTools(false); setState(next); }
  function dismiss() {
    if (pending.current) clearTimeout(pending.current);
    if (state === 'loading') announce('Sign-in cancelled. You can keep playing!');
    setState(null);
  }
  function preview(next: AuthState) {
    if (pending.current) clearTimeout(pending.current);
    setState(next);
    if (next === 'success') setSignedIn(true);
  }
  function continueGoogle() {
    setState('loading');
    pending.current = setTimeout(() => { setSignedIn(true); setState('success'); }, 1500);
  }
  useEffect(() => () => { if (pending.current) clearTimeout(pending.current); if (toastTimeout.current) clearTimeout(toastTimeout.current); }, []);
  useEffect(() => {
    if (!state) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const app = document.querySelector('.nimo-app') as HTMLElement | null;
    if (app) app.inert = true;
    const focusTimer = setTimeout(() => dialog.current?.focus(), 0);
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
      if (event.key !== 'Tab') return;
      const targets = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]') || []);
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { clearTimeout(focusTimer); document.body.style.overflow = previousOverflow; if (app) app.inert = false; document.removeEventListener('keydown', keyboard); lastFocus.current?.focus(); };
  }, [state]);

  const content = state === 'loading' ? { title: 'Signing you in…', description: 'Just a little moment. Your next adventure is waiting.', art: '🌟' } : state === 'success' ? { title: 'Hi, Alex! 👋', description: 'Your account has a happy little home here.', art: '🎉' } : state === 'error' ? { title: 'Something went wrong.', description: 'That’s okay! Try again, or keep playing without signing in.', art: '☁️' } : state === 'cancelled' ? { title: 'No worries, keep playing! 💛', description: 'Sign-in was cancelled. Your next adventure is still waiting.', art: '🌈' } : state === 'profile' ? { title: 'Your little playroom', description: 'A place for your progress, achievements, and happy discoveries.', art: '🌟' } : { title: 'Save Your Progress! 🌟', description: 'Sign in to keep your progress, achievements, and game history.', art: '🌈' };

  return <AccountContext.Provider value={{ signedIn, open: () => open(), profile: () => open('profile'), signOut: () => { setSignedIn(false); announce('Signed out of the preview. Let’s keep playing!'); }, loading: state === 'loading' }}>{children}{announcement && <div className="account-toast" role="status">{announcement}</div>}{state && createPortal(<div className="auth-backdrop" onClick={event => { if (event.target === event.currentTarget) dismiss(); }}><div className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-description" tabIndex={-1} ref={dialog}><button className="auth-close" onClick={dismiss} aria-label="Close sign-in">×</button><span className="auth-kicker">{state === 'profile' || state === 'success' ? 'YOUR LITTLE NIMOKIDS CORNER' : 'FOR GROWN-UPS • ALWAYS OPTIONAL'}</span><div className={`auth-art ${state === 'loading' ? 'auth-loading-art' : ''}`}><span aria-hidden="true">✦</span><div>{content.art}</div><span aria-hidden="true">✧</span></div><h1 id="auth-title">{content.title}</h1><p id="auth-description">{content.description}</p>{state === 'intro' && <div className="auth-benefits"><span>🌟 Little achievements</span><span>📖 Happy game memories</span><span>💛 Pick up where you left off</span></div>}{state === 'loading' && <div className="auth-loading" role="status" aria-label="Signing you in"><i /><i /><i /></div>}{(state === 'success' || state === 'profile') && <div className="preview-profile"><span className="account-avatar">A</span><div><strong>Alex</strong><span>Preview account • no data synced</span></div><span className="profile-check">✓</span></div>}{state !== 'loading' && state !== 'success' && state !== 'profile' && <Button variant="blue" className="google-button" onClick={continueGoogle}><GoogleLogo />{state === 'error' ? 'Try Again with Google' : 'Continue with Google'}</Button>}{(state === 'success' || state === 'profile') ? <Button className="auth-play" onClick={dismiss}>Back to playing! 🚀</Button> : <Button variant="lavender" className="auth-skip" onClick={dismiss}>{state === 'loading' ? 'Cancel and keep playing' : 'Continue without signing in'}</Button>}<p className="auth-reassurance">{state === 'success' || state === 'profile' ? 'You can always play with or without an account.' : 'No account needed to play. Not now. Not ever. 💛'}</p><div className="auth-preview-note">Interactive design preview — Google sign-in is not connected.<button onClick={() => setPreviewTools(value => !value)} aria-expanded={previewTools}>{previewTools ? 'Hide preview states ↑' : 'Preview other states ↓'}</button>{previewTools && <div className="auth-preview-states">{(['intro', 'loading', 'success', 'cancelled', 'error'] as AuthState[]).map(next => <button key={next} aria-pressed={state === next} onClick={() => preview(next)}>{next === 'intro' ? 'Sign in' : next.charAt(0).toUpperCase() + next.slice(1)}</button>)}</div>}</div></div></div>, document.body)}</AccountContext.Provider>;
}
