import type { AgeGroup } from './gameApi';

const AGE_KEY = 'nimokids_age_group';

export function loadAgeGroup(): AgeGroup | null {
  try {
    const value = localStorage.getItem(AGE_KEY);
    return value === 'AGE_1_3' || value === 'AGE_4_5' ? value : null;
  } catch { return null; }
}

export function saveAgeGroup(value: AgeGroup) {
  try { localStorage.setItem(AGE_KEY, value); } catch { /* storage blocked: the choice lasts for this visit only */ }
}

/** UI age label ('1–3' | '4–5') <-> backend enum. */
export const toAgeGroup = (label: '1–3' | '4–5'): AgeGroup => (label === '4–5' ? 'AGE_4_5' : 'AGE_1_3');
export const toAgeLabel = (group: AgeGroup): '1–3' | '4–5' => (group === 'AGE_4_5' ? '4–5' : '1–3');
