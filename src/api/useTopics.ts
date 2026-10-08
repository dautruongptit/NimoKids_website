import { useCallback, useEffect, useState } from 'react';
import { ApiError, isAbort } from './apiClient';
import { getTopics, type ApiTopic } from './gameApi';

export type TopicsState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; topics: ApiTopic[] };

/** Loads GET /topics. Returns the state plus `retry`. Only root topics are returned: a root plays its whole subtree. */
export function useTopics(): [TopicsState, () => void] {
  const [state, setState] = useState<TopicsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    getTopics(controller.signal)
      .then(list => {
        const roots = list.filter(topic => !topic.parentId).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setState({ status: 'ready', topics: roots });
      })
      .catch(error => {
        if (isAbort(error)) return;
        setState({ status: 'error', error: error instanceof ApiError ? error : new ApiError('NETWORK_ERROR', 'Could not reach the server') });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return [state, retry];
}
