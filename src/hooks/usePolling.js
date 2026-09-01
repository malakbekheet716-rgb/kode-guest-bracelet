import { useEffect, useRef, useState, useCallback } from 'react';
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from '../utils/constants';

/**
 * Polls `fetchFn` every POLL_INTERVAL_MS while `isTerminal(data)` is false.
 * Stops on a terminal state, on unmount, or after POLL_TIMEOUT_MS (surfacing
 * `timedOut` so the UI can show "taking longer than expected" per §6.6).
 */
export function usePolling(fetchFn, { isTerminal, enabled = true, deps = [] }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const startedAtRef = useRef(Date.now());

  const load = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    let intervalId;
    startedAtRef.current = Date.now();
    setTimedOut(false);

    const tick = async () => {
      const result = await load();
      if (cancelled || !result) return;
      const done = isTerminal(result);
      const elapsed = Date.now() - startedAtRef.current;
      if (done) {
        clearInterval(intervalId);
      } else if (elapsed >= POLL_TIMEOUT_MS) {
        setTimedOut(true);
        clearInterval(intervalId);
      }
    };

    tick();
    intervalId = setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { data, error, loading, timedOut, refetch: load };
}
