/**
 * Presentation only. The topic LIST comes from the database; the backend has no emoji / color, so they are looked up
 * by topic `code`. An unknown (new) topic still shows up with a neutral fallback, so adding a topic in the DB needs
 * no frontend release.
 */
export type TopicVisual = { emoji: string; color: string; image?: string };

const VISUALS: Record<string, TopicVisual> = {
  COLORS: { emoji: '🎨', color: 'pink' },
  ANIMALS: { emoji: '🐶', color: 'purple', image: '/assets/22216.png' },
  VEHICLES: { emoji: '🚗', color: 'purple' },
  FRUITS: { emoji: '🍎', color: 'pink', image: '/assets/556cb.png' },
  VEGETABLES: { emoji: '🥕', color: 'yellow' },
  OBJECTS: { emoji: '🪑', color: 'blue' },
  BODY_PARTS: { emoji: '👀', color: 'blue' },
  TOYS: { emoji: '🧸', color: 'pink' },
  JOB: { emoji: '👩‍⚕️', color: 'yellow' },
  MATH: { emoji: '🔢', color: 'purple' },
  PEOPLE_CHARACTERS: { emoji: '🦸', color: 'blue' },
};

const FALLBACK_COLORS = ['pink', 'purple', 'yellow', 'blue'];

export function topicVisual(code: string, position: number): TopicVisual {
  return VISUALS[code] ?? { emoji: '🌟', color: FALLBACK_COLORS[position % FALLBACK_COLORS.length] };
}
