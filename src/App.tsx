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

type Age = '1–3' | '4–5';
import AccountProvider, { AccountEntry, SaveProgressPrompt } from './components/AccountExperience';

function Progress({ step }: { step: number }) {
  return <div className="stepper" aria-label={`Step ${step} of 4`}><span className={step === 1 ? 'active' : ''}><i>1</i> Choose Age</span><Icon file="69568" /><span className={step === 2 ? 'active' : ''}><i>2</i> Choose Topic</span><Icon file="69568" /><span className={step === 3 ? 'active' : ''}><i>3</i> Play</span><Icon file="69568" /><span className={step === 4 ? 'active' : ''}><i>4</i> Celebrate</span></div>;
}

function NimoKids() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screen = pathname.slice(1) || 'home';
  const [age, setAge] = useState<Age | null>(() => { const saved = loadAgeGroup(); return saved ? toAgeLabel(saved) : null; });
  const [choice, setChoice] = useState<TopicChoice>(ALL_TOPICS);
  const topicName = choice.name;
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

  const say = useCallback((text: string, onDone?: () => void) => {
    if (muted || !('speechSynthesis' in window)) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = 'en-US'; voice.rate = .85; voice.pitch = 1.2;
    if (onDone) {
      // onend/onerror can be missed by some browsers: the guard keeps the countdown from never starting.
      let called = false;
      const done = () => { if (called) return; called = true; clearTimeout(guard); onDone(); };
      const guard = setTimeout(done, 5000);
      voice.onend = done; voice.onerror = done;
    }
    window.speechSynthesis.speak(voice);
  }, [muted]);

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

  function go(destination: string) {
    window.speechSynthesis?.cancel();
    navigate(destination === 'home' ? '/' : `/${destination}`);
    window.scrollTo({ top: 0 });
  }
  async function start() {
    if (!age) { go('age'); return; }
    if (starting) return;
    activateAudio();
    setStarting(true); setStartError(null);
    try {
      const created = await createSession({ topicId: choice.topic?.id ?? null, ageGroup: toAgeGroup(age) });
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
      setAnswerData(data); sound(state); say(data.feedback.message);
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

  useEffect(() => {
    if (!['home', 'age', 'topics', 'quiz', 'result'].includes(screen)) navigate('/', { replace: true });
    else if ((screen === 'topics' || screen === 'quiz' || screen === 'result') && !age) navigate('/age', { replace: true });
    else if (screen === 'quiz' && !session) navigate('/topics', { replace: true });
    else if (screen === 'result' && !result) navigate('/topics', { replace: true });
  }, [screen, age, session, result, navigate]);

  // Read the question aloud; the 8 s countdown starts only when the voice ends (and the server is told, see timer-start).
  useEffect(() => {
    if (screen !== 'quiz' || !question || !session) return;
    let active = true;
    setTimerRunning(false); setSeconds(timeLimit);
    say(question.questionText, () => {
      if (!active) return;
      setTimerRunning(true);
      void startTimer(session.sessionId, question.id).catch(() => { /* best effort: the server falls back to its capped start */ });
    });
    return () => { active = false; window.speechSynthesis?.cancel(); };
  }, [screen, question?.id]);

  useEffect(() => {
    if (screen !== 'quiz' || !timerRunning || feedback || transitioning) return;
    const interval = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [screen, timerRunning, feedback, transitioning, question?.id]);
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
    const text = `A little NimoKids celebration! ${score}/${total} discoveries in ${topicName}. 🌟`;
    try {
      if (navigator.share) await navigator.share({ title: 'NimoKids • Great Job!', text, url: window.location.origin });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(`${text} ${window.location.origin}`); setShareMessage('Celebration copied! 💛'); }
      else setShareMessage(text);
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setShareMessage(text); }
  }

  return <div className={`nimo-app screen-${screen}`}>
    <header className="nimo-header"><button className="nimo-logo" onClick={() => go('home')} aria-label="NimoKids home"><img src="/assets/e9d88.png" alt="NimoKids mascot" /><span>NimoKids</span></button><nav className="play-nav" aria-label="Main navigation"><button className="nav-active" onClick={() => go('home')}>Play</button><button onClick={() => go(age ? 'topics' : 'age')}>Adventures</button><span className="safe-tag"><Icon file="1375e" /> Toddler Safe</span></nav><div className="header-tools"><button className="sound-toggle" onClick={() => { activateAudio(); setMuted(value => !value); window.speechSynthesis?.cancel(); }} aria-label={muted ? 'Turn sound on' : 'Turn sound off'} aria-pressed={!muted}><Icon file="c975d" /><span>Sound<br />{muted ? 'OFF' : 'ON'}</span></button>{screen !== 'quiz' && <AccountEntry />}</div></header>
    {(screen === 'home' || screen === 'age') && <div className="reference-decor" aria-hidden="true"><img className="cloud-left" src="/assets/4a0bb.svg" alt="" /><img className="cloud-right" src="/assets/8cd9a.svg" alt="" /><img className="star-left" src="/assets/0157e.svg" alt="" /><img className="star-right" src="/assets/ba357.svg" alt="" /><img className="cloud-bottom" src="/assets/ff0b8.svg" alt="" /></div>}

    {screen === 'home' && <main className="home-page"><div className="home-welcome"><span className="welcome-pill">✨ A happy little place to learn</span><h1>Little discoveries.<br /><span>Big happy smiles.</span></h1><p>Look, listen, and play your way into a world of wonder.<br />A little adventure made just for your little one.</p><div className="home-actions"><Button onClick={() => { activateAudio(); say("Let's play! Choose your age."); go('age'); }}>Let's Play! 🚀 <span>▷</span></Button><span>For curious little minds, ages 1–5</span></div><div className="home-features"><span>👀 Look</span><i>→</i><span>👆 Tap</span><i>→</i><span>🌟 Celebrate</span></div></div><div className="home-photo"><img src="/assets/6cc17.png" alt="A friendly plush bear ready for a learning adventure" /><span className="photo-note">Your next adventure starts here! ✨</span><span className="floating-pill">💛 Little steps. Big wonder.</span></div><Hint><strong>No pressure, just exploration!</strong><p>No accounts. No complicated steps. Just a little learning and a lot of fun.</p></Hint></main>}

    {screen === 'age' && <main className="age-page"><Progress step={1} /><div className="age-heading"><h1><Icon file="f426f" /> Choose Your Age 🎈 <Icon file="0a6cb" /></h1><p>Tap your age to begin a happy learning adventure!</p></div><div className="age-grid">{(['1–3', '4–5'] as Age[]).map((value, position) => <button key={value} className={`age-card ${position ? 'older' : 'younger'} ${age === value ? 'age-selected' : ''}`} onClick={() => { activateAudio(); setAge(value); saveAgeGroup(toAgeGroup(value)); say('Choose a topic!'); go('topics'); }} aria-pressed={age === value}><div className="age-card-top"><span className="age-label"><Icon file={position ? 'cf7a5' : '16a55'} />{value} YEARS</span><span className="age-symbol"><Icon file={position ? 'cc2a9' : '80a6d'} /></span></div><div className="age-photo"><img src={position ? '/assets/6cc17.png' : '/assets/07c37.png'} alt={position ? 'A curious plush bear with a little backpack' : 'A cuddly kitten in a cozy playroom'} /></div><h2>{position ? 'Curious little explorers 🎒' : 'First little discoveries 🍼'}</h2><p>{position ? 'Growing curious minds with letters, numbers, and a colorful world of wonder.' : 'Big bright pictures, gentle sounds, and simple discoveries for little learners.'}</p><div className="micro-pills">{(position ? ['💡 Curious thinking', '🔢 Numbers & letters', '🌍 Explore the world'] : ['🖼️ Big bright pictures', '🎵 Gentle sounds', '✨ Easy little questions']).map(label => <span key={label}>{label}</span>)}</div><span className="age-cta">Choose {value} Years <Icon file={position ? '2399a' : '97a6b'} /></span></button>)}</div><div className="age-hint"><span><Icon file="8ee1c" /></span><div><strong>One tap, and on to Choose Topic! ✨</strong><p>Pick the little card that fits your child. Their next adventure is just a tap away.</p></div></div></main>}

    {screen === 'topics' && age && <TopicSelectionScreen ageLabel={age} selected={choice} onSelect={setChoice} onBack={() => go('age')} onStart={start} starting={starting} startError={startError} say={say} />}

    {screen === 'quiz' && question && <main className="quiz-page"><div className="screen-top"><span className="topic-indicator">{topicEmoji} {topicName}</span><div className="quiz-progress" aria-label={`Question ${questionNumber} of ${total}`}>{Array.from({ length: total }, (_, position) => <span className={position < questionNumber ? 'current' : ''} key={position}>★</span>)}</div><span className="question-counter">Question {questionNumber}/{total}</span></div><section className={`quiz-panel ${transitioning ? 'question-transition' : ''}`}><div className="quiz-heading"><div><span className="tiny-label">LOOK, LISTEN & DISCOVER</span><h1>{question.questionText} <Speaker onClick={() => say(question.questionText)} /></h1></div><div className={`countdown ${seconds <= 2 && !feedback ? 'timer-low' : ''}`} aria-label={`${seconds} seconds remaining`}><span>⏱</span><strong>{seconds}</strong><small>seconds</small></div></div><div className={`quiz-image ${topicColor}`} key={question.id}>{questionImageSrc(question.questionImage) && <img src={questionImageSrc(question.questionImage)!} alt="Look at this picture" />}<span className="image-sparkle" aria-hidden="true">✦</span></div><div className={`feedback-line ${feedback || ''}`} role="status">{feedback === 'correct' ? 'Great! 🎉' : feedback === 'wrong' ? 'Try again! 💛' : feedback === 'timeout' ? "Time's up! ⏰" : sendError ? 'Oops! Tap again 💛' : 'Tap your answer ↓'}</div><div className="answer-grid">{question.options.map(entry => {
      const isCorrect = !!answerData && entry.id === answerData.correctAnswer.id;
      const isWrongPick = !!answerData && entry.id === selected && !isCorrect;
      return <button key={entry.id} className={`quiz-answer ${isCorrect ? 'answer-correct' : isWrongPick ? 'answer-wrong' : feedback ? 'answer-disabled' : ''}`} onClick={() => void answer(entry.id)} disabled={!!feedback || transitioning}><span>{entry.text}</span>{isCorrect ? <span className="state-icon">✓</span> : isWrongPick ? <span className="state-icon">×</span> : null}</button>;
    })}</div>{feedback === 'correct' && <div className="celebration-sparkles" aria-hidden="true">✦　 ✧　 ✦　 ✧　 ✦</div>}</section><Hint><strong>{feedback === 'correct' ? "You're a little superstar!" : feedback ? 'Every try helps your little mind grow.' : 'Take a peek. You can do it!'}</strong><p>{feedback ? 'Another little discovery is on the way…' : 'Your next question comes along all by itself.'}</p></Hint></main>}

    {screen === 'result' && <main className="result-page"><Progress step={4} /><section className="result-panel"><span className="welcome-pill">✨ A little adventure. A big high five!</span><div className="reward-picture"><span>✦</span><span role="img" aria-label="Golden trophy">🏆</span><span>✧</span></div><h1>Great Job! 🎉</h1><p>You explored, you tried, and you learned something new!</p><div className="reward-stars" aria-label={`${score} stars`}>{Array.from({ length: total }, (_, position) => <span className={position < score ? 'earned' : ''} key={position}>★</span>)}</div><div className="final-score">{score}<span> / {total}</span></div><div className="result-stats"><div><span>🎯 Accuracy</span><strong>{Math.round(result?.accuracy ?? 0)}%</strong></div><div><span>🔥 Best streak</span><strong>{result?.maxStreak ?? 0}</strong></div><div><span>⭐ Current streak</span><strong>{result?.currentStreak ?? 0}</strong></div></div><Button onClick={start}>Play Again! 🚀</Button><div className="result-actions"><Button variant="blue" onClick={() => go('home')}>⌂ Home</Button><Button variant="lavender" onClick={share}>↗ Share</Button></div><p className="replay-note">{topicEmoji} More {topicName.toLowerCase()} fun • Ages {age}</p><p className="share-message" role="status">{shareMessage}</p></section></main>}

        {screen === 'result' && <SaveProgressPrompt />}
    {screen !== 'quiz' && <footer className="nimo-footer"><div><Icon file="46fe5" /><div><strong>Safe Digital Playroom for Toddlers</strong><p>No ads, gentle guidance, and endless little smiles</p></div></div><span>💛 Ages 1–5 • No accounts required</span><p>© {new Date().getFullYear()} NimoKids.<br />Made with love for little hands.</p></footer>}
  </div>;
}
const router = createBrowserRouter([{ path: '*', Component: NimoKids }]);
export default function App() { return <AccountProvider><RouterProvider router={router} /></AccountProvider>; }
