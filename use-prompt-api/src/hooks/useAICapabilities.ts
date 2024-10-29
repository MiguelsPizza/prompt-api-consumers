import { useState, useEffect, useCallback } from 'react';

interface AICapabilitiesResult {
  // Availability status
  available: AICapabilityAvailability;
  capabilities: AILanguageModelCapabilities | null;
  error: Error | null;

  // Download progress
  downloadProgress: { loaded: number; total: number } | null;
  isDownloading: boolean;

  // Model capabilities
  supportsLanguage: (languageTag: Intl.UnicodeBCP47LocaleIdentifier) => AICapabilityAvailability;
  defaultTemperature: number | null;
  maxTemperature: number | null;
  defaultTopK: number | null;
  maxTopK: number | null;

  // Download trigger
  startDownload: () => Promise<void>;
  cancelDownload: () => void;
}

export function useAICapabilities(): AICapabilitiesResult {
  const [available, setAvailable] = useState<AICapabilityAvailability>('no');
  const [capabilities, setCapabilities] = useState<AILanguageModelCapabilities | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const checkCapabilities = useCallback(async () => {
    if (!window.ai?.languageModel?.capabilities) {
      setAvailable('no');
      setError(new Error('Language Model API not available'));
      return;
    }

    try {
      const caps = await window.ai.languageModel.capabilities();
      setCapabilities(caps);
      setAvailable(caps.available);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check capabilities'));
    }
  }, []);

  // Initial capabilities check
  useEffect(() => {
    checkCapabilities();
  }, [checkCapabilities]);

  const startDownload = useCallback(async () => {
    if (available !== 'after-download') {
      return;
    }

    setIsDownloading(true);
    setError(null);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Create a temporary session just to trigger the download
      await window.ai.languageModel.create({
        signal: controller.signal,
        monitor: (monitor) => {
          monitor.addEventListener('downloadprogress', (event) => {
            setDownloadProgress({
              loaded: event.loaded,
              total: event.total
            });
          });
        }
      });

      // Recheck capabilities after download
      await checkCapabilities();
    } catch (err) {
      if (err.name === 'AbortError') {
        setError(new Error('Download cancelled'));
      } else {
        setError(err instanceof Error ? err : new Error('Download failed'));
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      setAbortController(null);
    }
  }, [available, checkCapabilities]);

  const cancelDownload = useCallback(() => {
    abortController?.abort();
  }, [abortController]);

  const supportsLanguage = useCallback(
    (languageTag: Intl.UnicodeBCP47LocaleIdentifier): AICapabilityAvailability => {
      return capabilities?.supportsLanguage(languageTag) ?? 'no';
    },
    [capabilities]
  );

  return {
    available,
    capabilities,
    error,
    downloadProgress,
    isDownloading,
    supportsLanguage,
    defaultTemperature: capabilities?.defaultTemperature ?? null,
    maxTemperature: capabilities?.maxTemperature ?? null,
    defaultTopK: capabilities?.defaultTopK ?? null,
    maxTopK: capabilities?.maxTopK ?? null,
    startDownload,
    cancelDownload
  };
}