import { useEffect, useRef, useState } from 'react';
import { LANGUAGE_OPTIONS, type LanguageMode } from '../i18n/languageMode';
import { useLanguage } from '../i18n/LanguageContext';

/** Small SVG flags: the flag emoji of Windows is drawn as the letters "VN" / "GB". */
function Vn() {
  return <svg viewBox="0 0 30 20" width="24" height="16" aria-hidden="true"><rect width="30" height="20" rx="3" fill="#DA251D" /><path d="m15 4 1.8 5.5h5.8l-4.7 3.4 1.8 5.5L15 15l-4.7 3.4 1.8-5.5-4.7-3.4h5.8z" fill="#FFE600" transform="scale(.7) translate(6.4 1.5)" /></svg>;
}
function Gb() {
  return <svg viewBox="0 0 30 20" width="24" height="16" aria-hidden="true"><rect width="30" height="20" rx="3" fill="#012169" /><path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" /><path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.6" /><path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" /><path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.4" /></svg>;
}
function Flags({ mode }: { mode: LanguageMode }) {
  return <span className="lang-flags">{mode === 'VI' ? <Vn /> : <Gb />}</span>;
}

/** A select: [flag] Học tiếng Việt | [flag] Học tiếng Anh. English-only (EN) stays hidden (see LANGUAGE_OPTIONS). */
export default function LanguageSwitcher() {
  const { mode, setMode, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const options = LANGUAGE_OPTIONS.filter(option => option.enabled);
  const labelOf = (m: LanguageMode) => m === 'VI' ? t('langVi') : t('langViEn');

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);

  return <div className="lang-select" ref={box}>
    <button type="button" className="lang-current" aria-haspopup="listbox" aria-expanded={open} aria-label={t('langLabel')} onClick={() => setOpen(value => !value)}>
      <Flags mode={mode} /><span className="lang-label">{labelOf(mode)}</span><span className="lang-caret" aria-hidden="true">▾</span>
    </button>
    {open && <ul className="lang-menu" role="listbox" aria-label={t('langLabel')}>
      {options.map(option => {
        const active = mode === option.mode;
        return <li key={option.mode} role="option" aria-selected={active}>
          <button type="button" className={`lang-option ${active ? 'lang-active' : ''}`} title={option.mode === 'VI' ? t('langViHint') : t('langViEnHint')} onClick={() => { setMode(option.mode); setOpen(false); }}>
            <Flags mode={option.mode} /><span className="lang-label">{labelOf(option.mode)}</span>
            {option.recommended && <span className="lang-badge">{t('recommended')}</span>}
          </button>
        </li>;
      })}
    </ul>}
  </div>;
}
