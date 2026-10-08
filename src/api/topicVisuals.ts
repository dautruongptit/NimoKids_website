/**
 * Presentation only. The topic LIST comes from the database; the backend has no emoji / color, so they are looked up
 * by topic `code`. An unknown (new) topic still shows up with a neutral fallback, so adding a topic in the DB needs
 * no frontend release.
 */
export type TopicVisual = { emoji: string; color: string; image?: string };

const VISUALS: Record<string, TopicVisual> = {
  ANIMALS: { emoji: '🐶', color: 'purple', image: '/assets/22216.png' },
  FRUITS: { emoji: '🍎', color: 'pink', image: '/assets/556cb.png' },
  VEGETABLES: { emoji: '🥕', color: 'yellow' },
  VEHICLES: { emoji: '🚗', color: 'purple' },
  COLORS: { emoji: '🎨', color: 'pink' },
  SHAPES: { emoji: '⭐', color: 'blue' },
  NUMBERS: { emoji: '🔢', color: 'purple' },
  TOYS: { emoji: '🧸', color: 'pink' },
  SEA_ANIMALS: { emoji: '🐠', color: 'blue' },
  ALPHABET: { emoji: '🔤', color: 'yellow' },
  CLOTHES: { emoji: '👕', color: 'pink' },
  HOME: { emoji: '🏠', color: 'purple' },
  BODY_PARTS: { emoji: '👀', color: 'blue' },
  NATURE: { emoji: '🌳', color: 'yellow' },
  WEATHER: { emoji: '☀️', color: 'blue' },
  FARM_ANIMALS: { emoji: '🐮', color: 'yellow' },
  FAMILY: { emoji: '👨‍👩‍👧', color: 'pink' },
  MUSIC_INSTRUMENTS: { emoji: '🎵', color: 'purple' },
  FOOD: { emoji: '🍔', color: 'pink' },
  DAILY_ACTIVITIES: { emoji: '🧼', color: 'blue' },
};

const FALLBACK_COLORS = ['pink', 'purple', 'yellow', 'blue'];

export function topicVisual(code: string, position: number): TopicVisual {
  return VISUALS[code] ?? { emoji: '🌟', color: FALLBACK_COLORS[position % FALLBACK_COLORS.length] };
}
