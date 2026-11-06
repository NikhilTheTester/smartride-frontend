import { useEffect, useRef } from 'react';

/** Calls `fn` immediately and then every `ms` milliseconds (simple live updates without WebSocket). */
export default function usePolling(fn, ms = 5000) {
  const saved = useRef(fn);
  saved.current = fn;

  useEffect(() => {
    saved.current();
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}
