import { useCallback, useEffect, useRef, useState } from 'react';
import { createBrowserRouter, RouterProvider, useLocation, useNavigate } from 'react-router';
import Button from './components/Button';
import { Hint, Icon, Speaker } from './components/Ui';
import TopicSelectionScreen, { ALL_TOPICS, type TopicChoice } from './screens/TopicSelectionScreen';
import { loadAgeGroup, saveAgeGroup, toAgeGroup, toAgeLabel } from './api/playerPrefs';
import { createSession, finishSession, startTimer, submitAnswer, timeoutQuestion, type ApiAnswer, type ApiQuestion, type ApiResult, type ApiSession } from './api/gameApi';
import { topicVisual } from './api/topicVisuals';
import { questionImageSrc } from './api/questionImage';
import { ApiError } from './api/apiClient';
import AccountProvider, { AccountEntry, AuthLanding, SaveProgressPrompt } from './components/AccountExperience';
import LanguageSwitcher from './components/LanguageSwitcher';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import type { UiLang } from './i18n/strings';

type Age = '1–3' | '4–5';
const VOICE_LANG: Record<UiLang, string> = { en: 'en-US', vi: 'vi-VN' };
/** Must match GameConstants.MAX_LISTEN_AGAIN on the server (which enforces it). */
const MAX_LISTEN_AGAIN = 2;

function Progress({ step }: { step: number }) {
  const { t } = useLanguage();
  return <div className="stepper" aria-label={t('stepLabel', { n: step })}><span className={step === 1 ? 'active' : ''}><i>1</i> {t('stepAge')}</span><Icon file="69568" /><span className={step === 2 ? 'active' : ''}><i>2</i> {t('stepTopic')}</span><Icon file="69568" /><span className={step === 3 ? 'active' : ''}><i>3</i> {t('stepPlay')}</span><Icon file="69568" /><span className={step === 4 ? 'active' : ''}><i>4</i> {t('stepCelebrate')}</span></div>;
}

function NimoKids() {
  const { mode, t, tl, uiLang, questionLang } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screen = pathname.slice(1) || 'home';
  const [age, setAge] = useState<Age | null>(() => { const saved = loadAgeGroup(); return saved ? toAgeLabel(saved) : null; });
  const [choice, setChoice] = useState<TopicChoice>(ALL_TOPICS);
  const topicName = choice.topic ? choice.topic.name : t('allTopics');
  const visual = topicVisual(choice.topic?.code ?? 'ALL', 0);
  const topicEmoji = choice.topic ? visual.emoji : '🌈';
  const topicColor = choice.topic ? visual.color : 'pink';
  // Everything about the round comes from the server (session, questions, grading, score, streak, result).
  const [session, setSession] = useState<ApiSession | null>(null);
  const [question, setQuestion] = useState<ApiQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [timeLimit, setTimeLimit] = useState(8);
  const [seconds, setSeconds] = useState(8);
  const [timerRunning, setTimerRunning] = useState(false);
  const [answerData, setAnswerData] = useState<ApiAnswer | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [sendError, setSendError] = useState(false);
  const feedback = answerData ? (answerData.result === 'CORRECT' ? 'correct' : answerData.result === 'TIMEOUT' ? 'timeout' : 'wrong') : null;
  const [selected, setSelected] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const total = session?.totalQuestions ?? 5;
  const score = result?.correctAnswers ?? 0;
  const locked = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const voiceRun = useRef(0); // a newer reading of the question ("Listen again") cancels the callbacks of the older one

  const say = useCallback((text: string, lang: UiLang = uiLang, onDone?: () => void) => {
    if (muted || !('speechSynthesis' in window)) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = VOICE_LANG[lang]; voice.rate = .85; voice.pitch = 1.2;
    if (onDone) {
      // onend/onerror can be missed by some browsers: the guard keeps the countdown from never starting.
      let called = false;
      const done = () => { if (called) return; called = true; clearTimeout(guard); onDone(); };
      const guard = setTimeout(done, 5000);
      voice.onend = done; voice.onerror = done;
    }
    window.speechSynthesis.speak(voice);
  }, [muted, uiLang]);

  function activateAudio() {
    if (!audioContext.current && 'AudioContext' in window) audioContext.current = new AudioContext();
    if (audioContext.current?.state === 'suspended') void audioContext.current.resume();
  }
  function sound(state: 'correct' | 'wrong' | 'timeout') {
    const context = audioContext.current;
    if (muted || !context) return;
    const notes = state === 'correct' ? [523, 659, 784] : state === 'wrong' ? [392, 440] : [440, 392, 349];
    notes.forEach((frequency, position) => {
      const oscillator = context.createOscillator(); const gain = context.createGain();
      const start = context.currentTime + position * .13;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.07, start + .015); gain.gain.exponentialRampToValueAtTime(.001, start + .18);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + .2);
    });
  }

  /** Soft tick-tock for the countdown: two alternating pitches, a little higher and louder for the last two seconds. */
  function tick(remaining: number) {
    const context = audioContext.current;
    if (muted || !context) return;
    const urgent = remaining <= 2;
    const oscillator = context.createOscillator(); const gain = context.createGain();
    const start = context.currentTime;
    oscillator.type = 'triangle'; oscillator.frequency.value = (remaining % 2 ? 880 : 660) * (urgent ? 1.25 : 1);
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(urgent ? .09 : .05, start + .005); gain.gain.exponentialRampToValueAtTime(.001, start + .09);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + .1);
  }

  /** "Listen again": read the question again; the countdown starts over when the voice ends (the server is told too). */
  const [replays, setReplays] = useState<{ id: string; n: number }>({ id: '', n: 0 });
  const replaysLeft = Math.max(0, MAX_LISTEN_AGAIN - (question && replays.id === question.id ? replays.n : 0));
  function listenAgain() {
    if (!question || !session || locked.current || transitioning || feedback || replaysLeft === 0) return;
    setReplays(value => ({ id: question.id, n: (value.id === question.id ? value.n : 0) + 1 }));
    const run = ++voiceRun.current;
    setTimerRunning(false); setSeconds(timeLimit);
    say(question.questionText, questionLang, () => {
      if (run !== voiceRun.current || locked.current) return;
      setTimerRunning(true);
      void startTimer(session.sessionId, question.id, true).catch(() => { /* best effort */ });
    });
  }

  function go(destination: string) {
    window.speechSynthesis?.cancel();
    navigate(destination === 'home' ? '/' : `/${destination}`);
    window.scrollTo({ top: 0 });
  }
  const start = () => startWith(choice);
  async function startWith(picked: TopicChoice) {
    if (!age) { go('age'); return; }
    if (starting) return;
    activateAudio();
    setStarting(true); setStartError(null);
    try {
      const created = await createSession({ topicId: picked.topic?.id ?? null, ageGroup: toAgeGroup(age) });
      if (!created.question) throw new ApiError('BAD_RESPONSE', 'The server sent no question');
      locked.current = false;
      setSession(created); setQuestion(created.question); setQuestionNumber(created.currentQuestionNumber);
      setTimeLimit(created.timeLimitSeconds); setSeconds(created.timeLimitSeconds); setTimerRunning(false);
      setAnswerData(null); setResult(null); setSelected(null); setTransitioning(false); setSendError(false); setShareMessage('');
      go('quiz');
    } catch (error) {
      setStartError(error instanceof ApiError ? error.code : 'NETWORK_ERROR');
      if (screen !== 'topics') go('topics');
    } finally { setStarting(false); }
  }

  /** Grading, score and streak are decided by the server; the UI only shows what it answers. */
  async function answer(optionId: string | null) {
    if (locked.current || transitioning || !question || !session) return;
    locked.current = true; setTimerRunning(false); setSendError(false); setSelected(optionId);
    try {
      let data: ApiAnswer;
      try {
        data = optionId === null ? await timeoutQuestion(session.sessionId, question.id) : await submitAnswer(session.sessionId, question.id, optionId);
      } catch (error) {
        // Tapped after the server deadline: the server wants it recorded as a timeout.
        if (optionId !== null && error instanceof ApiError && error.code === 'ANSWER_TIMEOUT') data = await timeoutQuestion(session.sessionId, question.id);
        else throw error;
      }
      const state = data.result === 'CORRECT' ? 'correct' : data.result === 'TIMEOUT' ? 'timeout' : 'wrong';
      setAnswerData(data); sound(state); say(data.feedback.message, questionLang);
    } catch (error) {
      const offline = error instanceof ApiError && ['NETWORK_ERROR', 'TIMEOUT', 'HTTP_502', 'HTTP_503', 'HTTP_504'].includes(error.code);
      if (offline) { setSendError(true); setSelected(null); locked.current = false; return; } // let the child tap again
      setStartError('SESSION_LOST'); setSession(null); go('topics'); // session expired / already answered: start a fresh round
    }
  }

  async function finishRound() {
    if (!session) return;
    try { setResult(await finishSession(session.sessionId)); }
    catch {
      // Last resort so a flaky network never traps the child on the last question: show what the last answer reported.
      const correct = answerData?.score ?? 0;
      setResult({ sessionId: session.sessionId, topic: session.topic, totalQuestions: total, correctAnswers: correct, wrongAnswers: total - correct, timeoutAnswers: 0, score: correct, accuracy: Math.round(correct * 100 / total), currentStreak: answerData?.currentStreak ?? 0, maxStreak: answerData?.currentStreak ?? 0, earnedStickers: [] });
    }
    go('result');
  }

  useEffect(() => { setChoice(ALL_TOPICS); setStartError(null); }, [mode]);

  useEffect(() => {
    if (!['home', 'age', 'topics', 'quiz', 'result', 'auth/complete', 'auth/error'].includes(screen)) navigate('/', { replace: true });
    else if ((screen === 'topics' || screen === 'quiz' || screen === 'result') && !age) navigate('/age', { replace: true });
    else if (screen === 'quiz' && !session) navigate('/topics', { replace: true });
    else if (screen === 'result' && !result) navigate('/topics', { replace: true });
  }, [screen, age, session, result, navigate]);

  // Read the question aloud; the 8 s countdown starts only when the voice ends (and the server is told, see timer-start).
  useEffect(() => {
    if (screen !== 'quiz' || !question || !session) return;
    let active = true;
    const run = ++voiceRun.current;
    setTimerRunning(false); setSeconds(timeLimit);
    // The voice starts only once the screen is painted and the picture has loaded (at most 1.5 s of waiting for a slow picture).
    const picture = questionImageSrc(question.questionImage);
    const pictureReady = new Promise<void>(resolve => {
      if (!picture) { resolve(); return; }
      const image = new Image();
      image.onload = image.onerror = () => resolve();
      image.src = picture;
      setTimeout(resolve, 1500);
    });
    const painted = new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    void Promise.all([pictureReady, painted]).then(() => {
      if (!active || run !== voiceRun.current) return;
      say(question.questionText, questionLang, () => {
        if (!active || run !== voiceRun.current) return;
        setTimerRunning(true);
        void startTimer(session.sessionId, question.id).catch(() => { /* best effort: the server falls back to its capped start */ });
      });
    });
    return () => { active = false; window.speechSynthesis?.cancel(); };
  }, [screen, question?.id]);

  useEffect(() => {
    if (screen !== 'quiz' || !timerRunning || feedback || transitioning) return;
    const interval = setInterval(() => setSeconds(value => { const next = Math.max(0, value - 1); if (next > 0) tick(next); return next; }), 1000);
    return () => clearInterval(interval);
  }, [screen, timerRunning, feedback, transitioning, question?.id, muted]);
  useEffect(() => { if (screen === 'quiz' && timerRunning && seconds === 0 && !feedback && !transitioning) void answer(null); }, [screen, timerRunning, seconds, feedback, transitioning]);
  useEffect(() => {
    if (screen !== 'quiz' || !answerData) return;
    const timeout = setTimeout(() => { if (answerData.hasNextQuestion) setTransitioning(true); else void finishRound(); }, 800);
    return () => clearTimeout(timeout);
  }, [screen, answerData]);
  useEffect(() => {
    if (!transitioning || screen !== 'quiz') return;
    const timeout = setTimeout(() => {
      const next = answerData?.nextQuestion;
      if (!next) return;
      setQuestion(next.question); setQuestionNumber(next.questionNumber); setTimeLimit(next.timeLimitSeconds); setSeconds(next.timeLimitSeconds);
      setAnswerData(null); setSelected(null); locked.current = false; setTransitioning(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [transitioning, screen]);

  async function share() {
    const text = t('shareText', { score, total, topic: topicName });
    try {
      if (navigator.share) await navigator.share({ title: t('shareTitle'), text, url: window.location.origin });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(`${text} ${window.location.origin}`); setShareMessage(t('copied')); }
      else setShareMessage(text);
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setShareMessage(text); }
  }

  return <div className={`nimo-app screen-${screen}`}>
    <header className="nimo-header"><button className="nimo-logo" onClick={() => go(screen === 'quiz' ? 'topics' : 'home')} aria-label={t('homeLabel')}><img src="/assets/e9d88.png" alt={t('mascotAlt')} /><span>NimoKids{screen === 'quiz' && <small>{t('logoTagline')}</small>}</span></button>{screen === 'quiz' && <span className="topic-indicator header-topic">{topicEmoji} {topicName}</span>}{screen !== 'quiz' && <nav className="play-nav" aria-label={t('mainNav')}><button className="nav-active" onClick={() => go('home')}>{t('home')}</button><button onClick={() => go(age ? 'topics' : 'age')}>{t('adventures')}</button>{screen !== 'quiz' && <LanguageSwitcher />}</nav>}<div className="header-tools"><button className={`sound-toggle ${muted ? 'is-muted' : ''}`} onClick={() => { activateAudio(); setMuted(value => !value); window.speechSynthesis?.cancel(); }} aria-label={muted ? t('soundOnLabel') : t('soundOffLabel')} title={muted ? t('soundOnLabel') : t('soundOffLabel')} aria-pressed={!muted}><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />{muted ? <path d="M3 3l18 18" strokeWidth="2.6" /> : <><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" /></>}</svg></button><AccountEntry /></div></header>
    {(screen === 'home' || screen === 'age') && <div className="reference-decor" aria-hidden="true"><img className="cloud-left" src="/assets/4a0bb.svg" alt="" /><img className="cloud-right" src="/assets/8cd9a.svg" alt="" /><img className="star-left" src="/assets/0157e.svg" alt="" /><img className="star-right" src="/assets/ba357.svg" alt="" /><img className="cloud-bottom" src="/assets/ff0b8.svg" alt="" /></div>}

    {screen === 'auth/complete' && <AuthLanding kind="complete" />}
    {screen === 'auth/error' && <AuthLanding kind="error" />}

    {screen === 'home' && <main className="home-page"><div className="home-welcome"><span className="welcome-pill">{t('homePill')}</span><h1>{t('homeTitle1')}<br /><span>{t('homeTitle2')}</span></h1><p>{tl('homeText')}</p><div className="home-actions"><Button onClick={() => { activateAudio(); say(t('sayLetsPlay'), uiLang); go('topics'); }}>{t('homeCta')} <span>▷</span></Button><span>{t('homeAges')}</span></div><div className="home-features"><span>{t('featLook')}</span><i>→</i><span>{t('featTap')}</span><i>→</i><span>{t('featCelebrate')}</span></div></div><div className="home-photo"><img src="/assets/6cc17.png" alt={t('homePhotoAlt')} /><span className="photo-note">{t('photoNote')}</span><span className="floating-pill">{t('floatPill')}</span></div><Hint><strong>{t('hintTitle')}</strong><p>{t('hintText')}</p></Hint></main>}

    {screen === 'age' && <main className="age-page"><Progress step={1} /><div className="age-heading"><h1><Icon file="f426f" /> {t('ageTitle')} <Icon file="0a6cb" /></h1><p>{t('ageSubtitle')}</p></div><div className="age-grid">{(['1–3', '4–5'] as Age[]).map((value, position) => <button key={value} className={`age-card ${position ? 'older' : 'younger'} ${age === value ? 'age-selected' : ''}`} onClick={() => { activateAudio(); setAge(value); saveAgeGroup(toAgeGroup(value)); say(t('sayChooseTopic'), uiLang); go('topics'); }} aria-pressed={age === value}><div className="age-card-top"><span className="age-label"><Icon file={position ? 'cf7a5' : '16a55'} />{value} {t('years')}</span><span className="age-symbol"><Icon file={position ? 'cc2a9' : '80a6d'} /></span></div><div className="age-photo"><img src={position ? '/assets/6cc17.png' : '/assets/07c37.png'} alt={position ? t('ageOldAlt') : t('ageYoungAlt')} /></div><h2>{position ? t('ageOldTitle') : t('ageYoungTitle')}</h2><p>{position ? t('ageOldText') : t('ageYoungText')}</p><div className="micro-pills">{(position ? t('ageOldPills') : t('ageYoungPills')).split('|').map(label => <span key={label}>{label}</span>)}</div><span className="age-cta">{t('chooseYears', { age: value })} <Icon file={position ? '2399a' : '97a6b'} /></span></button>)}</div></main>}

    {screen === 'topics' && age && <TopicSelectionScreen ageLabel={age} selected={choice} onSelect={picked => { setChoice(picked); void startWith(picked); }} starting={starting} startError={startError} say={say} />}

    {screen === 'quiz' && question && <main className="quiz-page"><section className={`quiz-panel ${transitioning ? 'question-transition' : ''}`}><div className="quiz-heading"><div className="quiz-progress-box"><span className="question-counter">{t('question', { n: questionNumber, total })}</span><div className="quiz-progress" aria-label={t('questionAria', { n: questionNumber, total })}>{Array.from({ length: total }, (_, position) => <span className={position < questionNumber ? 'current' : ''} key={position}>★</span>)}</div></div><h1>{question.questionText}</h1><div className="quiz-tools"><button className="tap-hear" onClick={listenAgain} disabled={!!feedback || transitioning || replaysLeft === 0}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" /><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" /></svg> {t('tapToHear')} <small>({replaysLeft})</small></button><div className={`countdown ${seconds <= 2 && !feedback ? 'timer-low' : ''}`} aria-label={t('secondsAria', { n: seconds })}><span>⏱</span><strong>{seconds}</strong></div></div></div><div className={`quiz-image ${topicColor}`} key={question.id}>{questionImageSrc(question.questionImage) && <img src={questionImageSrc(question.questionImage)!} alt={t('pictureAlt')} />}<span className="image-sparkle" aria-hidden="true">✦</span></div><div className={`feedback-line ${feedback || ''}`} role="status">{feedback === 'correct' ? t('fbCorrect') : feedback === 'wrong' ? t('fbWrong') : feedback === 'timeout' ? t('fbTimeout') : sendError ? t('tapAgain') : t('tapAnswer')}</div><div className="answer-grid">{question.options.map(entry => {
      const isCorrect = !!answerData && entry.id === answerData.correctAnswer.id;
      const isWrongPick = !!answerData && entry.id === selected && !isCorrect;
      return <button key={entry.id} className={`quiz-answer ${isCorrect ? 'answer-correct' : isWrongPick ? 'answer-wrong' : feedback ? 'answer-disabled' : ''}`} onClick={() => void answer(entry.id)} disabled={!!feedback || transitioning}><span>{entry.text}</span>{isCorrect ? <span className="state-icon">✓</span> : isWrongPick ? <span className="state-icon">×</span> : null}</button>;
    })}</div>{feedback === 'correct' && <div className="celebration-sparkles" aria-hidden="true">✦　 ✧　 ✦　 ✧　 ✦</div>}</section><Hint><strong>{feedback === 'correct' ? t('quizHintCorrect') : feedback ? t('quizHintAnswered') : t('quizHintIdle')}</strong><p>{feedback ? t('quizHint2Answered') : t('quizHint2Idle')}</p></Hint></main>}

    {screen === 'result' && <main className="result-page"><Progress step={4} /><section className="result-panel"><span className="welcome-pill">{t('resultPill')}</span><div className="reward-picture"><span>✦</span><span role="img" aria-label={t('trophy')}>🏆</span><span>✧</span></div><h1>{t('greatJob')}</h1><p>{t('resultText')}</p><div className="reward-stars" aria-label={t('starsLabel', { n: score })}>{Array.from({ length: total }, (_, position) => <span className={position < score ? 'earned' : ''} key={position}>★</span>)}</div><div className="final-score">{score}<span> / {total}</span></div><div className="result-stats"><div><span>{t('accuracy')}</span><strong>{Math.round(result?.accuracy ?? 0)}%</strong></div><div><span>{t('bestStreak')}</span><strong>{result?.maxStreak ?? 0}</strong></div><div><span>{t('currentStreak')}</span><strong>{result?.currentStreak ?? 0}</strong></div></div><Button onClick={start}>{t('playAgain')}</Button><div className="result-actions"><Button variant="blue" onClick={() => go('home')}>{t('homeButton')}</Button><Button variant="lavender" onClick={share}>{t('share')}</Button></div><p className="replay-note">{topicEmoji} {t('replayNote', { topic: topicName, age: age ?? '' })}</p><p className="share-message" role="status">{shareMessage}</p></section></main>}

    {screen === 'result' && <SaveProgressPrompt />}
    {screen !== 'quiz' && <footer className="nimo-footer site-footer">
      <div className="footer-grid">
        <div className="footer-brand"><div className="footer-logo"><img src="/assets/e9d88.png" alt="" /><strong>NimoKids</strong></div><p>{t('footerBrandText')}</p><div className="footer-badges"><span className="safe-tag"><Icon file="1375e" /> {t('safeTag')}</span><span>{t('footerAges')}</span></div></div>
        <nav className="footer-col" aria-label={t('footerPlay')}><h3>{t('footerPlay')}</h3><button onClick={() => go('home')}>{t('footerLinkHome')}</button><button onClick={() => go('age')}>{t('footerLinkAge')}</button><button onClick={() => go(age ? 'topics' : 'age')}>{t('footerLinkTopics')}</button></nav>
        <div className="footer-col"><h3>{t('footerParents')}</h3><ul><li>{t('footerFact1')}</li><li>{t('footerFact2')}</li><li>{t('footerFact3')}</li><li>{t('footerFact4')}</li></ul></div>
      </div>
      <div className="footer-bottom"><span><Icon file="46fe5" /> {t('footerTitle')}</span><span>© {new Date().getFullYear()} NimoKids · {t('footerMade')}</span></div>
    </footer>}
  </div>;
}
const router = createBrowserRouter([{ path: '*', Component: NimoKids }]);
export default function App() { return <LanguageProvider><AccountProvider><RouterProvider router={router} /></AccountProvider></LanguageProvider>; }
