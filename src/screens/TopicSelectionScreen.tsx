import { useState } from 'react';
import Button from '../components/Button';
import { Hint, Icon, Speaker } from '../components/Ui';
import { topicVisual } from '../api/topicVisuals';
import { useTopics } from '../api/useTopics';
import type { ApiTopic } from '../api/gameApi';

/** What the child picks. `topic: null` is the "All Topics" tile = MIX mode (POST /game-sessions with topicId null). */
export type TopicChoice = { key: string; topic: ApiTopic | null; name: string };

export const ALL_TOPICS: TopicChoice = { key: 'ALL', topic: null, name: 'All Topics' };

type Props = {
  ageLabel: string;
  selected: TopicChoice;
  onSelect: (choice: TopicChoice) => void;
  onBack: () => void;
  onStart: () => void;
  say: (text: string) => void;
};

const VISIBLE_AT_FIRST = 10;

export default function TopicSelectionScreen({ ageLabel, selected, onSelect, onBack, onStart, say }: Props) {
  const [state, retry] = useTopics();
  const [expanded, setExpanded] = useState(false);

  const choices: TopicChoice[] = state.status === 'ready'
    ? [ALL_TOPICS, ...state.topics.map(topic => ({ key: topic.id, topic, name: topic.name }))]
    : [];
  const shown = expanded ? choices : choices.slice(0, VISIBLE_AT_FIRST);
  const selectedVisual = topicVisual(selected.topic?.code ?? 'ALL', 0);

  return <>
    <main className="topic-page">
      <div className="screen-top"><Button variant="blue" className="back-button" onClick={onBack}><Icon file="17a18" /> Back</Button><span className="step-label"><Icon file="1595a" /> Step 2 of 4: Choose Topic</span></div>
      <section className="prompt-banner"><div className="prompt-group"><Speaker large onClick={() => say('Choose a topic! What do you want to learn today?')} label="Listen to topic guide" /><div><h1>Choose a Topic! 🎯</h1><p>What do you want to learn today?<br />Tap a squishy card and let's explore!</p></div></div><span className="preschool-pill"><Icon file="98042" /> Preschool Safe •<br />100% Fun</span></section>

      {state.status === 'loading' && <TopicsLoading />}
      {state.status === 'error' && <TopicsError code={state.error.code} onRetry={retry} />}

      {state.status === 'ready' && <>
        <div className="topic-cards">{shown.map((choice, position) => {
          const isAll = choice.topic === null;
          const visual = topicVisual(choice.topic?.code ?? 'ALL', position);
          const active = selected.key === choice.key;
          return <article key={choice.key} className={`topic-tile ${isAll ? 'all-topics' : ''} ${active ? 'topic-selected' : ''}`}>
            <button className="topic-select" aria-pressed={active} onClick={() => { onSelect(choice); say(isAll ? 'All topics! Surprise me!' : choice.name); }}>
              <span className="question-pill">5 Questions</span>
              {isAll && <span className="surprise-tag"><Icon file="278d6" /> Surprise me!</span>}
              <div className={`topic-picture ${isAll ? 'pink' : visual.color}`}>{visual.image ? <img src={visual.image} alt={choice.name} /> : <span role="img" aria-label={choice.name}>{isAll ? '🌈' : visual.emoji}</span>}</div>
              <div className="topic-copy"><h2>{isAll ? '🌈 All Topics' : `${visual.emoji} ${choice.name}`}</h2><p>{isAll ? 'Surprise me!' : choice.topic?.description}</p>{isAll && <span>Little surprises from all our friendly worlds!</span>}</div>
              {active && <span className="topic-check" aria-label="Selected">✓</span>}
            </button>
            <Speaker label={`Hear ${choice.name}`} onClick={() => say(choice.name)} />
          </article>;
        })}</div>
        {choices.length > VISIBLE_AT_FIRST && <Button variant="blue" className="more-topics" onClick={() => setExpanded(value => !value)}>{expanded ? 'Fewer little worlds ↑' : 'More little worlds ↓'}</Button>}
      </>}

      <Hint><strong>No pressure, just exploration!</strong><p>Every answer is a new discovery. Let's see what we can learn!</p></Hint>
      <div className="age-reminder">Made for your {ageLabel}-year-old explorer <span>♡</span></div>
    </main>

    <div className="play-dock"><div className="dock-inner">
      <div className="selected-topic"><span>{selected.topic ? selectedVisual.emoji : '🌈'}</span><div><small>Selected Topic:</small><strong>{selected.name}</strong></div></div>
      <Button onClick={onStart} disabled={state.status !== 'ready'}>Let's Play! 🚀 <span>▷</span></Button>
    </div></div>
  </>;
}

function TopicsLoading() {
  return <div className="topic-loading" role="status" aria-live="polite">
    <div className="loading-buddy" aria-hidden="true"><span>🧸</span><i>✦</i><i>✧</i><i>✦</i></div>
    <p>Finding happy little worlds…</p>
    <div className="topic-cards" aria-hidden="true">{Array.from({ length: 6 }, (_, position) => <div className="topic-skeleton" key={position} style={{ animationDelay: `${position * 90}ms` }}><span /><i /><b /></div>)}</div>
  </div>;
}

function TopicsError({ code, onRetry }: { code: string; onRetry: () => void }) {
  // 502/503/504 come from the proxy/gateway when the API itself is down: same meaning as "cannot reach the server".
  const offline = ['NETWORK_ERROR', 'TIMEOUT', 'HTTP_502', 'HTTP_503', 'HTTP_504'].includes(code);
  return <div className="topic-error" role="alert">
    <div className="error-buddy" aria-hidden="true">{offline ? '☁️' : '🙈'}</div>
    <h2>Oops! Let's try again</h2>
    <p>{offline ? 'The little worlds are a bit shy right now. Check the internet and try again.' : 'Something went wrong on our side. Please try again in a moment.'}</p>
    <Button onClick={onRetry}>Try again 🔄</Button>
  </div>;
}
