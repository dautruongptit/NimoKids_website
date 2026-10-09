import { LANGUAGE_OPTIONS } from '../i18n/languageMode';
import { useLanguage } from '../i18n/LanguageContext';

/** 🇻🇳 Tiếng Việt  |  🇻🇳➞🇬🇧 Học tiếng Anh. English-only (EN) is hidden until it is developed (see LANGUAGE_OPTIONS). */
export default function LanguageSwitcher() {
  const { mode, setMode, t } = useLanguage();
  const options = LANGUAGE_OPTIONS.filter(option => option.enabled);
  return <div className="lang-switch" role="radiogroup" aria-label={t('langLabel')}>
    {options.map(option => {
      const label = option.mode === 'VI' ? t('langVi') : t('langViEn');
      const hint = option.mode === 'VI' ? t('langViHint') : t('langViEnHint');
      const active = mode === option.mode;
      return <button key={option.mode} type="button" role="radio" aria-checked={active} className={`lang-option ${active ? 'lang-active' : ''}`} title={hint} onClick={() => setMode(option.mode)}>
        <span className="lang-flag" aria-hidden="true">{option.flag}</span>
        <span className="lang-label">{label}</span>
        {option.recommended && <span className="lang-badge">{t('recommended')}</span>}
      </button>;
    })}
  </div>;
}
