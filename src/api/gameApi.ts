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

export type ApiAnswer = {
  result: 'CORRECT' | 'WRONG' | 'TIMEOUT';
  correct: boolean;
  score: number;
  currentStreak: number;
  /** Revealed only after the child answered. */
  correctAnswer: { id: string; text: string; voice: string | null };
  feedback: { voice: string | null; message: string };
  hasNextQuestion: boolean;
  nextQuestion: { questionNumber: number; timeLimitSeconds: number; question: ApiQuestion } | null;
};

export type ApiSticker = { code: string; name: string; image: string | null; rarity: string; earnedAt: string };
export type ApiResult = {
  sessionId: string;
  topic: { id: string; name: string } | null;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeoutAnswers: number;
  score: number;
  accuracy: number;
  currentStreak: number;
  maxStreak: number;
  earnedStickers: ApiSticker[];
};

const sessionPath = (sessionId: string, action: string) => `/game-sessions/${sessionId}/${action}`;

/** Tell the server the question audio ended: the 8 s countdown starts now. Best effort: the server has a capped fallback. */
export const startTimer = (sessionId: string, questionId: string) =>
  apiPost<null>(sessionPath(sessionId, 'timer-start'), { questionId });

export const submitAnswer = (sessionId: string, questionId: string, selectedOptionId: string) =>
  apiPost<ApiAnswer>(sessionPath(sessionId, 'submit-answer'), { questionId, selectedOptionId });

export const timeoutQuestion = (sessionId: string, questionId: string) =>
  apiPost<ApiAnswer>(sessionPath(sessionId, 'timeout'), { questionId });

export const finishSession = (sessionId: string) => apiPost<ApiResult>(sessionPath(sessionId, 'finish'));
