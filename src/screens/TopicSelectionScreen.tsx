import { useEffect, useRef, useState } from 'react';
import { MAX_TOPICS, VISIBLE_AT_FIRST, useRowsOnScroll } from './useRowsOnScroll';
import Button from '../components/Button';
import { Hint, Icon, Speaker } from '../components/Ui';
import { topicVisual } from '../api/topicVisuals';
import { useTopics } from '../api/useTopics';
import type { ApiTopic } from '../api/gameApi';
import { useLanguage } from '../i18n/LanguageContext';
import type { UiLang } from '../i18n/strings';

/** What the child picks. `topic: null` is the "All Topics" tile = MIX mode (POST /game-sessions with topicId null). */
export type TopicChoice = { key: string; topic: ApiTopic | null };

export const ALL_TOPICS: TopicChoice = { key: 'ALL', topic: null };

type Props = {
  ageLabel: string;
  selected: TopicChoice;
  onSelect: (choice: TopicChoice) => void;
  starting?: boolean;
  startError?: string | null;
  say: (text: string, lang?: UiLang) => void;
};

const OFFLINE_CODES = ['NETWORK_ERROR', 'TIMEOUT', 'HTTP_502', 'HTTP_503', 'HTTP_504'];

export default function TopicSelectionScreen({ ageLabel, selected, onSelect, starting = false, startError = null, say }: Props) {
  const { mode, t, tl, uiLang, contentLang } = useLanguage();
  const [state, retry] = useTopics(mode);
  const [visible, setVisible] = useState(VISIBLE_AT_FIRST);
  const [isLoading, setIsLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const choices: TopicChoice[] = state.status === 'ready'
    ? state.topics.slice(0, MAX_TOPICS).map(topic => ({ key: topic.id, topic }))
    : [];
  const shown = choices.slice(0, visible);
  const hasMore = visible < choices.length;

  useRowsOnScroll({ sentinel, total: choices.length, visible, setVisible, isLoading, setIsLoading });
  // Topic names come from the server in the content language; the "All Topics" tile is interface text.
  const nameOf = (choice: TopicChoice) => choice.topic ? choice.topic.name : t('allTopics');

  return <>
    <main className="topic-page">
      <section className="surprise-card" onClick={() => { if (state.status === 'ready' && !starting) onSelect(ALL_TOPICS); }}>
        <span className="surprise-badge"><Icon file="278d6" /> {t('favouriteBadge')}</span>
        <span className="surprise-dice" role="img" aria-label={t('allTopics')}>🎲</span>
        <div className="surprise-copy"><h1>🌈 {t('allTopicsTitle')} <small>({t('surpriseHint')})</small></h1><p>{t('surpriseDesc')}</p></div>
        <Button className="surprise-cta" disabled={state.status !== 'ready' || starting}>{t('playSurprise')} 🎲 <span>▷</span></Button>
      </section>
      {state.status === 'ready' && <h2 className="pick-heading"><span><i aria-hidden="true" />{t('orPickOne')}</span><em>{t('wonderTopics', { n: choices.length })}</em></h2>}

      {state.status === 'loading' && <TopicsLoading />}
      {state.status === 'error' && <TopicsError code={state.error.code} onRetry={retry} />}

      {state.status === 'ready' && <>
        <div className={`topic-cards ${starting ? 'topics-busy' : ''}`}>{shown.map((choice, position) => {
          const isAll = choice.topic === null;
          const visual = topicVisual(choice.topic?.code ?? 'ALL', position);
          const active = selected.key === choice.key;
          const name = nameOf(choice);
          return <article key={choice.key} className={`topic-tile ${isAll ? 'all-topics' : ''} ${active ? 'topic-selected' : ''}`}>
            <button className="topic-select" aria-pressed={active} disabled={starting} onClick={() => { onSelect(choice); }}>
              <span className="question-pill">{t('fiveQuestions')}</span>
              {isAll && <span className="surprise-tag"><Icon file="278d6" /> {t('surprise')}</span>}
              <div className={`topic-picture ${isAll ? 'pink' : visual.color}`}>{visual.image ? <img src={visual.image} alt={name} /> : <span role="img" aria-label={name}>{isAll ? '🌈' : visual.emoji}</span>}</div>
              <div className="topic-copy"><h2>{isAll ? `🌈 ${name}` : `${visual.emoji} ${name}`}</h2><p>{isAll ? t('surprise') : choice.topic?.description}</p>{isAll && <span>{t('allTopicsText')}</span>}</div>
              {active && <span className="topic-check" aria-label={t('selected')}>✓</span>}
            </button>
            <Speaker label={t('hear', { name })} onClick={() => say(name, isAll ? uiLang : contentLang)} />
          </article>;
        })}</div>
        {hasMore && <div ref={sentinel} className="topics-sentinel" aria-hidden="true" />}
        {isLoading && <div className="topics-more-loading" role="status" aria-live="polite"><span className="topics-spinner" aria-hidden="true" />{t('loadingMoreTopics')}</div>}
      </>}

      {starting && <StartingOverlay />}
      {startError && <p className="start-error" role="alert">{startMessage(startError, t)}</p>}
      <Hint><strong>{t('topicHintTitle')}</strong><p>{t('topicHintText')}</p></Hint>
      <div className="age-reminder">{t('ageReminder', { age: ageLabel })} <span>♡</span></div>
    </main>

  </>;
}

/** Shown from the tap until the first question arrives; after 5 s it tells the child the network is slow. */
function StartingOverlay() {
  const { t } = useLanguage();
  const [slow, setSlow] = useState(false);
  const [lit, setLit] = useState(0);
  useEffect(() => {
    const slowTimer = setTimeout(() => setSlow(true), 5000);
    const stars = setInterval(() => setLit(value => (value + 1) % 6), 450);
    return () => { clearTimeout(slowTimer); clearInterval(stars); };
  }, []);
  return <div className="starting-overlay" role="status" aria-live="polite">
    <div className="starting-card">
      <div className="loading-buddy" aria-hidden="true"><span>🧸</span><i>✦</i><i>✧</i><i>✦</i></div>
      <h2>{t('loadingQuestions')}</h2>
      <div className="starting-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, position) => <span key={position} className={position < lit ? 'lit' : ''}>★</span>)}</div>
      <p className={slow ? 'starting-slow' : 'starting-slow starting-hidden'}>{t('loadingSlow')}</p>
    </div>
  </div>;
}

function TopicsLoading() {
  const { t } = useLanguage();
  return <div className="topic-loading" role="status" aria-live="polite">
    <div className="loading-buddy" aria-hidden="true"><span>🧸</span><i>✦</i><i>✧</i><i>✦</i></div>
    <p>{t('topicsLoading')}</p>
    <div className="topic-cards" aria-hidden="true">{Array.from({ length: 6 }, (_, position) => <div className="topic-skeleton" key={position} style={{ animationDelay: `${position * 90}ms` }}><span /><i /><b /></div>)}</div>
  </div>;
}

function TopicsError({ code, onRetry }: { code: string; onRetry: () => void }) {
  const { t } = useLanguage();
  // 502/503/504 come from the proxy/gateway when the API itself is down: same meaning as "cannot reach the server".
  const offline = OFFLINE_CODES.includes(code);
  return <div className="topic-error" role="alert">
    <div className="error-buddy" aria-hidden="true">{offline ? '☁️' : '🙈'}</div>
    <h2>{t('errTitle')}</h2>
    <p>{offline ? t('errOffline') : t('errServer')}</p>
    <Button onClick={onRetry}>{t('tryAgain')}</Button>
  </div>;
}

function startMessage(code: string, t: ReturnType<typeof useLanguage>['t']): string {
  if (code === 'INSUFFICIENT_QUESTIONS' || code === 'TOPIC_NOT_PLAYABLE') return t('startNotReady');
  if (code === 'SESSION_LOST') return t('startLost');
  if (OFFLINE_CODES.includes(code)) return t('startOffline');
  return t('errServer');
}
