/**
 * Language mode of the player.
 *
 *  EN     full English                                   (backlog: not offered in the UI yet, see `enabled`)
 *  VI     full Vietnamese: interface, questions, answers
 *  VI_EN  Vietnamese interface, English questions and answers  (recommended: "learn English")
 *
 * The mode is kept in localStorage (`nimokids_lang`) and sent to the backend with POST /game-sessions.
 */
export type LanguageMode = 'EN' | 'VI' | 'VI_EN';

export const LANGUAGE_STORAGE_KEY = 'nimokids_lang';

export type LanguageOption = {
  mode: LanguageMode;
  flag: string;
  /** false = hidden from the switcher (waiting list) but still a valid stored / default value. */
  enabled: boolean;
  recommended?: boolean;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { mode: 'EN', flag: '🇬🇧', enabled: false },
  { mode: 'VI', flag: '🇻🇳', enabled: true },
  { mode: 'VI_EN', flag: '🇻🇳➞🇬🇧', enabled: true, recommended: true },
];

export function isLanguageMode(value: unknown): value is LanguageMode {
  return value === 'EN' || value === 'VI' || value === 'VI_EN';
}

/** Browser locale -> default mode: Vietnamese (vi, vi-VN ...) starts as VI_EN, everyone else as EN. */
export function detectLanguageMode(): LanguageMode {
  const locale = (typeof navigator !== 'undefined' && (navigator.language || navigator.languages?.[0])) || '';
  return /^vi(-|_|$)/i.test(locale) ? 'VI_EN' : 'EN';
}

function readStored(): LanguageMode | null {
  try {
    const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguageMode(value) ? value : null;
  } catch { return null; }
}

export function saveLanguageMode(mode: LanguageMode) {
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, mode); } catch { /* storage blocked: the choice lasts for this visit only */ }
}

/** Stored choice, or the detected default (which is then stored so the next visit and the API calls agree). */
export function loadLanguageMode(): LanguageMode {
  const stored = readStored();
  if (stored) return stored;
  const detected = detectLanguageMode();
  saveLanguageMode(detected);
  return detected;
}

/** Language of the interface (texts around the game). */
export const uiLanguage = (mode: LanguageMode): 'en' | 'vi' => (mode === 'EN' ? 'en' : 'vi');
/** Language of the game content (questions, answers, topic names, feedback) as served by the backend. */
export const contentLanguage = (mode: LanguageMode): 'en' | 'vi' => (mode === 'VI' ? 'vi' : 'en');
