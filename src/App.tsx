import { useCallback, useEffect, useRef, useState } from 'react';
import { createBrowserRouter, RouterProvider, useLocation, useNavigate } from 'react-router';
import { generateQuestions, questionImage, topics, type Age, type Question, type Topic } from './gameData';
import Button from './components/Button';
import { Hint, Icon, Speaker } from './components/Ui';
import TopicSelectionScreen, { ALL_TOPICS, type TopicChoice } from './screens/TopicSelectionScreen';
import { loadAgeGroup, saveAgeGroup, toAgeGroup, toAgeLabel } from './api/playerPrefs';
import AccountProvider, { AccountEntry, SaveProgressPrompt } from './components/AccountExperience';

function Progress({ step }: { step: number }) {
  return <div className="stepper" aria-label={`Step ${step} of 4`}><span className={step === 1 ? 'active' : ''}><i>1</i> Choose Age</span><Icon file="69568" /><span className={step === 2 ? 'active' : ''}><i>2</i> Choose Topic</span><Icon file="69568" /><span className={step === 3 ? 'active' : ''}><i>3</i> Play</span><Icon file="69568" /><span className={step === 4 ? 'active' : ''}><i>4</i> Celebrate</span></div>;
}

function mockTopicFor(choice: TopicChoice): Topic {
  if (!choice.topic) return topics[0];
  const name = choice.name.toLowerCase();
  return topics.find(entry => entry.name.toLowerCase() === name || entry.name.toLowerCase().startsWith(name) || name.startsWith(entry.name.toLowerCase())) ?? topics[0];
}

function NimoKids() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screen = pathname.slice(1) || 'home';
  const [age, setAge] = useState<Age | null>(() => { const saved = loadAgeGroup(); return saved ? toAgeLabel(saved) : null; });
  const [choice, setChoice] = useState<TopicChoice>(ALL_TOPICS);
  // TEMPORARY BRIDGE: the quiz still plays on local data (gameData.ts) until step "Play" is wired to POST /game-sessions.
  const topic: Topic = mockTopicFor(choice);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(5);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [muted, setMuted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const locked = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const question = questions[index];

  const say = useCallback((text: string) => {
    if (muted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = 'en-US'; voice.rate = .85; voice.pitch = 1.2;
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
  function start() {
    if (!age) { go('age'); return; }
    activateAudio();
    setQuestions(generateQuestions(age, topic)); setIndex(0); setSeconds(5);
    setScore(0); setBestStreak(0); setCurrentStreak(0); setFeedback(null); setSelected(null); setTransitioning(false); setShareMessage('');
    locked.current = false; go('quiz');
  }

  function answer(name: string | null) {
    if (locked.current || transitioning || !question) return;
    locked.current = true;
    const state = name === null ? 'timeout' : name === question.answer.name ? 'correct' : 'wrong';
    setSelected(name); setFeedback(state); sound(state);
    if (state === 'correct') { const nextStreak = currentStreak + 1; setScore(value => value + 1); setCurrentStreak(nextStreak); setBestStreak(best => Math.max(best, nextStreak)); }
    else setCurrentStreak(0);
    say(state === 'correct' ? 'Great!' : state === 'timeout' ? "Time's up!" : 'Try again!');
  }

  useEffect(() => {
    if (!['home', 'age', 'topics', 'quiz', 'result'].includes(screen)) navigate('/', { replace: true });
    else if ((screen === 'topics' || screen === 'quiz' || screen === 'result') && !age) navigate('/age', { replace: true });
    else if ((screen === 'quiz' || screen === 'result') && !questions.length) navigate('/topics', { replace: true });
  }, [screen, age, questions.length, navigate]);

  useEffect(() => {
    if (screen === 'quiz' && question && !transitioning) say(question.text);
    return () => { window.speechSynthesis?.cancel(); };
  }, [screen, question?.id, say]);

  useEffect(() => {
    if (screen !== 'quiz' || feedback || transitioning || !question) return;
    const interval = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [screen, index, feedback, transitioning, questions]);
  useEffect(() => { if (screen === 'quiz' && seconds === 0 && !feedback && !transitioning) answer(null); }, [screen, seconds, feedback, transitioning]);
  useEffect(() => {
    if (screen !== 'quiz' || !feedback) return;
    const timeout = setTimeout(() => { if (index === 4) go('result'); else setTransitioning(true); }, 800);
    return () => clearTimeout(timeout);
  }, [screen, feedback, index]);
  useEffect(() => {
    if (!transitioning || screen !== 'quiz') return;
    const timeout = setTimeout(() => { setIndex(value => value + 1); setSeconds(5); setFeedback(null); setSelected(null); locked.current = false; setTransitioning(false); }, 350);
    return () => clearTimeout(timeout);
  }, [transitioning, screen]);

  async function share() {
    const text = `A little NimoKids celebration! ${score}/5 discoveries in ${topic.name}. 🌟`;
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

    {screen === 'topics' && age && <TopicSelectionScreen ageLabel={age} selected={choice} onSelect={setChoice} onBack={() => go('age')} onStart={start} say={say} />}

    {screen === 'quiz' && question && <main className="quiz-page"><div className="screen-top"><span className="topic-indicator">{topic.emoji} {topic.name}</span><div className="quiz-progress" aria-label={`Question ${index + 1} of 5`}>{Array.from({ length: 5 }, (_, position) => <span className={position <= index ? 'current' : ''} key={position}>★</span>)}</div><span className="question-counter">Question {index + 1}/5</span></div><section className={`quiz-panel ${transitioning ? 'question-transition' : ''}`}><div className="quiz-heading"><div><span className="tiny-label">LOOK, LISTEN & DISCOVER</span><h1>{question.text} <Speaker onClick={() => say(question.text)} /></h1></div><div className={`countdown ${seconds <= 2 && !feedback ? 'timer-low' : ''}`} aria-label={`${seconds} seconds remaining`}><span>⏱</span><strong>{seconds}</strong><small>seconds</small></div></div><div className={`quiz-image ${question.topic.color}`} key={question.id}><img src={questionImage(question.answer)} alt={`Question picture: ${question.answer.name}`} /><span className="image-sparkle" aria-hidden="true">✦</span>{topic.name === 'All Topics' && <span className="image-topic">{question.topic.emoji} {question.topic.name}</span>}</div><div className={`feedback-line ${feedback || ''}`} role="status">{feedback === 'correct' ? 'Great! 🎉' : feedback === 'wrong' ? 'Try again! 💛' : feedback === 'timeout' ? "Time's up! ⏰" : 'Tap your answer ↓'}</div><div className="answer-grid">{question.options.map(entry => <button key={`${question.id}-${entry.name}`} className={`quiz-answer ${feedback && entry.name === question.answer.name ? 'answer-correct' : feedback && entry.name === selected ? 'answer-wrong' : feedback ? 'answer-disabled' : ''}`} onClick={() => answer(entry.name)} disabled={!!feedback || transitioning}><span>{entry.name}</span>{feedback && entry.name === question.answer.name ? <span className="state-icon">✓</span> : feedback && entry.name === selected ? <span className="state-icon">×</span> : null}</button>)}</div>{feedback === 'correct' && <div className="celebration-sparkles" aria-hidden="true">✦　 ✧　 ✦　 ✧　 ✦</div>}</section><Hint><strong>{feedback === 'correct' ? "You're a little superstar!" : feedback ? 'Every try helps your little mind grow.' : 'Take a peek. You can do it!'}</strong><p>{feedback ? 'Another little discovery is on the way…' : 'Your next question comes along all by itself.'}</p></Hint></main>}

    {screen === 'result' && <main className="result-page"><Progress step={4} /><section className="result-panel"><span className="welcome-pill">✨ A little adventure. A big high five!</span><div className="reward-picture"><span>✦</span><span role="img" aria-label="Golden trophy">🏆</span><span>✧</span></div><h1>Great Job! 🎉</h1><p>You explored, you tried, and you learned something new!</p><div className="reward-stars" aria-label={`${score} stars`}>{Array.from({ length: 5 }, (_, position) => <span className={position < score ? 'earned' : ''} key={position}>★</span>)}</div><div className="final-score">{score}<span> / 5</span></div><div className="result-stats"><div><span>🎯 Accuracy</span><strong>{score * 20}%</strong></div><div><span>🔥 Best streak</span><strong>{bestStreak}</strong></div><div><span>⭐ Current streak</span><strong>{currentStreak}</strong></div></div><Button onClick={start}>Play Again! 🚀</Button><div className="result-actions"><Button variant="blue" onClick={() => go('home')}>⌂ Home</Button><Button variant="lavender" onClick={share}>↗ Share</Button></div><p className="replay-note">{topic.emoji} More {topic.name.toLowerCase()} fun • Ages {age}</p><p className="share-message" role="status">{shareMessage}</p></section></main>}

        {screen === 'result' && <SaveProgressPrompt />}
    {screen !== 'quiz' && <footer className="nimo-footer"><div><Icon file="46fe5" /><div><strong>Safe Digital Playroom for Toddlers</strong><p>No ads, gentle guidance, and endless little smiles</p></div></div><span>💛 Ages 1–5 • No accounts required</span><p>© {new Date().getFullYear()} NimoKids.<br />Made with love for little hands.</p></footer>}
  </div>;
}
const router = createBrowserRouter([{ path: '*', Component: NimoKids }]);
export default function App() { return <AccountProvider><RouterProvider router={router} /></AccountProvider>; }
