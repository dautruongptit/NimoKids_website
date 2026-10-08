import { apiGet, apiPost } from './apiClient';

/** Mirrors the backend enum AgeGroup. */
export type AgeGroup = 'AGE_1_3' | 'AGE_4_5';

/** Backend TopicResponse (GET /topics). The backend has no emoji / color: see topicVisuals.ts. */
export type ApiTopic = {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  coverImageUrl: string | null;
  minAge: number | null;
  maxAge: number | null;
  displayOrder: number | null;
};

export type ApiGameMode = { id: string; code: string; name: string; description: string | null };

export type ApiOption = { id: string; text: string; image: string | null; voice: string | null };
export type ApiQuestion = {
  id: string;
  questionText: string;
  questionVoice: string | null;
  objectSound: string | null;
  questionImage: string | null;
  options: ApiOption[];
};
export type ApiSession = {
  sessionId: string;
  status: 'STARTED' | 'COMPLETED' | 'ABANDONED';
  topic: { id: string; name: string } | null;
  totalQuestions: number;
  currentQuestionNumber: number;
  timeLimitSeconds: number;
  question: ApiQuestion | null;
};

export const getTopics = (signal?: AbortSignal) => apiGet<ApiTopic[]>('/topics', signal);

let gameModeId: Promise<string> | null = null;
/** The backend requires gameModeId; there is a single GUESS mode today. Fetched once and cached for the visit. */
export function getDefaultGameModeId(): Promise<string> {
  gameModeId ??= apiGet<ApiGameMode[]>('/game-modes')
    .then(modes => {
      const mode = modes.find(entry => entry.code === 'GUESS') ?? modes[0];
      if (!mode) throw new Error('No game mode available');
      return mode.id;
    })
    .catch(error => { gameModeId = null; throw error; }); // do not cache a failure
  return gameModeId;
}

/**
 * POST /game-sessions. `topicId: null` = MIX mode (All Topics). The backend answers with the session and the FIRST
 * question; the next ones arrive inside every answer response (there is no endpoint that returns all 5 at once, and
 * correct answers are never sent to the browser).
 */
export async function createSession(params: { topicId: string | null; ageGroup: AgeGroup }, signal?: AbortSignal) {
  const gameModeId = await getDefaultGameModeId();
  return apiPost<ApiSession>('/game-sessions', { topicId: params.topicId, gameModeId, ageGroup: params.ageGroup }, signal);
}
