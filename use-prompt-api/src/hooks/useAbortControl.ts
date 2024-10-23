import { useState, useCallback } from 'react';

export function useAbortControl() {
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const abort = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
  }, [abortController]);

  return {
    abortController,
    setAbortController,
    abort
  };
}
