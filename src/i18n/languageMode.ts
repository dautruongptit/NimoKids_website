/**
 * Language mode of the player.
 *
 *  EN     full English                                   (backlog: not offered in the UI yet, see `enabled`)
 *  VI     full Vietnamese: interface, questions, answers
 *  VI_EN  "learn English" (recommended): Vietnamese interface and Vietnamese questions, English answers
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

/** First visit: always "learn English" (VI_EN). The choice is then kept in localStorage; a stored choice wins. */
export function detectLanguageMode(): LanguageMode {
  return 'VI_EN';
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
/** Language of topic names and of the answer words as served by the backend (VI = Vietnamese, EN and VI_EN = English). */
export const contentLanguage = (mode: LanguageMode): 'en' | 'vi' => (mode === 'VI' ? 'vi' : 'en');
/** Language of the question and of the feedback (the "template" side): Vietnamese for VI and VI_EN. */
export const questionLanguage = (mode: LanguageMode): 'en' | 'vi' => (mode === 'EN' ? 'en' : 'vi');
