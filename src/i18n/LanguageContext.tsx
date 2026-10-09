import { createContext, Fragment, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { contentLanguage, loadLanguageMode, questionLanguage, saveLanguageMode, uiLanguage, type LanguageMode } from './languageMode';
import { translate, type UiKey, type UiLang } from './strings';

type LanguageValue = {
  mode: LanguageMode;
  setMode: (mode: LanguageMode) => void;
  /** Language of the interface texts. */
  uiLang: UiLang;
  /** Language of the answer words and the topic names as served by the backend. */
  contentLang: UiLang;
  /** Language of the question text and of the feedback (spoken with this voice). */
  questionLang: UiLang;
  t: (key: UiKey, vars?: Record<string, string | number>) => string;
  /** Like t() but turns "\n" into <br />. */
  tl: (key: UiKey, vars?: Record<string, string | number>) => ReactNode;
};

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<LanguageMode>(() => {
    const initial = loadLanguageMode();
    document.documentElement.lang = uiLanguage(initial);
    return initial;
  });
  const ui = uiLanguage(mode);

  const setMode = useCallback((next: LanguageMode) => {
    saveLanguageMode(next);
    document.documentElement.lang = uiLanguage(next);
    setModeState(next);
  }, []);

  const value = useMemo<LanguageValue>(() => {
    const t: LanguageValue['t'] = (key, vars) => translate(ui, key, vars);
    const tl: LanguageValue['tl'] = (key, vars) => t(key, vars).split('\n').map((line, index) => <Fragment key={index}>{index > 0 && <br />}{line}</Fragment>);
    return { mode, setMode, uiLang: ui, contentLang: contentLanguage(mode), questionLang: questionLanguage(mode), t, tl };
  }, [mode, setMode, ui]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('LanguageProvider missing');
  return value;
}
