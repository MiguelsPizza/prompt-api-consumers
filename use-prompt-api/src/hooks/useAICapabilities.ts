import { useState, useEffect, useRef } from 'react';

export function useAICapabilities() {
  const mountedRef = useRef<boolean>(true);
  const [available, setAvailable] = useState<AICapabilityAvailability>('no');
  const [capabilities, setCapabilities] = useState<AILanguageModelCapabilities | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkCapabilities = async () => {
      if (!window.ai?.languageModel?.capabilities) {
        setAvailable('no');
        setError(new Error('Language Model API not available'));
        return;
      }

      try {
        const caps = await window.ai.languageModel.capabilities();
        if (mountedRef.current) {
          setCapabilities(caps);
          setAvailable(caps.available);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to check capabilities'));
        }
      }
    };

    checkCapabilities();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { available, capabilities, error };
}
