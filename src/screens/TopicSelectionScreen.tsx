import { useState } from 'react';
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
  onBack: () => void;
  onStart: () => void;
  starting?: boolean;
  startError?: string | null;
  say: (text: string, lang?: UiLang) => void;
};

const VISIBLE_AT_FIRST = 10;
const OFFLINE_CODES = ['NETWORK_ERROR', 'TIMEOUT', 'HTTP_502', 'HTTP_503', 'HTTP_504'];

export default function TopicSelectionScreen({ ageLabel, selected, onSelect, onBack, onStart, starting = false, startError = null, say }: Props) {
  const { mode, t, tl, uiLang, contentLang } = useLanguage();
  const [state, retry] = useTopics(mode);
  const [expanded, setExpanded] = useState(false);

  const choices: TopicChoice[] = state.status === 'ready'
    ? [ALL_TOPICS, ...state.topics.map(topic => ({ key: topic.id, topic }))]
    : [];
  const shown = expanded ? choices : choices.slice(0, VISIBLE_AT_FIRST);
  const selectedVisual = topicVisual(selected.topic?.code ?? 'ALL', 0);
  // Topic names come from the server in the content language; the "All Topics" tile is interface text.
  const nameOf = (choice: TopicChoice) => choice.topic ? choice.topic.name : t('allTopics');

  return <>
    <main className="topic-page">
      <div className="screen-top"><Button variant="blue" className="back-button" onClick={onBack}><Icon file="17a18" /> {t('back')}</Button><span className="step-label"><Icon file="1595a" /> {t('topicStep')}</span></div>
      <section className="prompt-banner"><div className="prompt-group"><Speaker large onClick={() => say(t('sayTopicGuide'), uiLang)} label={t('listenGuide')} /><div><h1>{t('topicTitle')}</h1><p>{tl('topicText')}</p></div></div><span className="preschool-pill"><Icon file="98042" /> {tl('preschoolPill')}</span></section>

      {state.status === 'loading' && <TopicsLoading />}
      {state.status === 'error' && <TopicsError code={state.error.code} onRetry={retry} />}

      {state.status === 'ready' && <>
        <div className="topic-cards">{shown.map((choice, position) => {
          const isAll = choice.topic === null;
          const visual = topicVisual(choice.topic?.code ?? 'ALL', position);
          const active = selected.key === choice.key;
          const name = nameOf(choice);
          return <article key={choice.key} className={`topic-tile ${isAll ? 'all-topics' : ''} ${active ? 'topic-selected' : ''}`}>
            <button className="topic-select" aria-pressed={active} onClick={() => { onSelect(choice); if (isAll) say(t('saySurprise'), uiLang); else say(name, contentLang); }}>
              <span className="question-pill">{t('fiveQuestions')}</span>
              {isAll && <span className="surprise-tag"><Icon file="278d6" /> {t('surprise')}</span>}
              <div className={`topic-picture ${isAll ? 'pink' : visual.color}`}>{visual.image ? <img src={visual.image} alt={name} /> : <span role="img" aria-label={name}>{isAll ? '🌈' : visual.emoji}</span>}</div>
              <div className="topic-copy"><h2>{isAll ? `🌈 ${name}` : `${visual.emoji} ${name}`}</h2><p>{isAll ? t('surprise') : choice.topic?.description}</p>{isAll && <span>{t('allTopicsText')}</span>}</div>
              {active && <span className="topic-check" aria-label={t('selected')}>✓</span>}
            </button>
            <Speaker label={t('hear', { name })} onClick={() => say(name, isAll ? uiLang : contentLang)} />
          </article>;
        })}</div>
        {choices.length > VISIBLE_AT_FIRST && <Button variant="blue" className="more-topics" onClick={() => setExpanded(value => !value)}>{expanded ? t('fewerWorlds') : t('moreWorlds')}</Button>}
      </>}

      {startError && <p className="start-error" role="alert">{startMessage(startError, t)}</p>}
      <Hint><strong>{t('topicHintTitle')}</strong><p>{t('topicHintText')}</p></Hint>
      <div className="age-reminder">{t('ageReminder', { age: ageLabel })} <span>♡</span></div>
    </main>

    <div className="play-dock"><div className="dock-inner">
      <div className="selected-topic"><span>{selected.topic ? selectedVisual.emoji : '🌈'}</span><div><small>{t('selectedTopic')}</small><strong>{nameOf(selected)}</strong></div></div>
      <Button onClick={onStart} disabled={state.status !== 'ready' || starting}>{starting ? t('gettingReady') : <>{t('letsPlay')} <span>▷</span></>}</Button>
    </div></div>
  </>;
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
