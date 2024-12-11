import { useState, useEffect, useCallback, createContext, PropsWithChildren, useContext } from 'react';

// Add interfaces before the class implementations
interface IAICapabilityError {
  readonly code: 'API_UNAVAILABLE' | 'CAPABILITY_CHECK_FAILED';
  name: string;
  message: string;
}

interface IAIDownloadError {
  readonly code: 'DOWNLOAD_CANCELLED' | 'DOWNLOAD_FAILED';
  name: string;
  message: string;
}

class AICapabilityError<T extends 'API_UNAVAILABLE' | 'CAPABILITY_CHECK_FAILED'>
  extends Error
  implements IAICapabilityError {
  constructor(
    message: string,
    public readonly code: T,
  ) {
    super(message);
    this.name = 'AICapabilityError';
  }
}

class AIDownloadError<T extends 'DOWNLOAD_CANCELLED' | 'DOWNLOAD_FAILED'>
  extends Error
  implements IAIDownloadError {
  constructor(
    message: string,
    public readonly code: T,
  ) {
    super(message);
    this.name = 'AIDownloadError';
  }
}

export type UseAICapabilitiesError =
  | AIDownloadError<'DOWNLOAD_CANCELLED' | 'DOWNLOAD_FAILED'>
  | AICapabilityError<'API_UNAVAILABLE' | 'CAPABILITY_CHECK_FAILED'>;

interface AICapabilitiesResult {
  // Availability status
  available: AICapabilityAvailability;
  capabilities: AILanguageModelCapabilities | null;
  error: UseAICapabilitiesError | null;

  // Download progress
  downloadProgress: { loaded: number; total: number } | null;
  isDownloading: boolean;

  // Model capabilities
  supportsLanguage: (
    languageTag: Intl.UnicodeBCP47LocaleIdentifier,
  ) => AICapabilityAvailability;
  defaultTemperature: number | null;
  defaultTopK: number | null;
  maxTopK: number | null;
  //maxTemperature: number \ null; not supported yet

  // Download trigger
  startDownload: () => Promise<void>;
  cancelDownload: () => void;
}

const AICapabilitiesContext = createContext<AICapabilitiesResult | null>(null);


export function AICapabilitiesProvider({ children }: PropsWithChildren) {
  const [available, setAvailable] = useState<AICapabilityAvailability>('no');
  const [capabilities, setCapabilities] =
    useState<AILanguageModelCapabilities | null>(null);
  const [error, setError] = useState<UseAICapabilitiesError | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    loaded: number;
    total: number;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const checkCapabilities = useCallback(async () => {
    // Add check for window object (SSR safety)
    if (
      typeof window === 'undefined' ||
      !window.ai?.languageModel?.capabilities
    ) {
      setAvailable('no');
      setError(
        new AICapabilityError(
          'Language Model API not available',
          'API_UNAVAILABLE',
        ),
      );
      return;
    }

    try {
      const caps = await window.ai.languageModel.capabilities();
      setCapabilities(caps);
      setAvailable(caps.available);
      setError(null); // Clear any previous errors on success
    } catch (err) {
      setAvailable('no'); // Set availability to no on error
      setCapabilities(null); // Clear capabilities on error
      setError(
        new AICapabilityError(
          err instanceof Error ? err.message : 'Failed to check capabilities',
          'CAPABILITY_CHECK_FAILED',
        ),
      );
    }
    // usually I'd clean this up but I'm not sure with this one since it's a background process of the browser
    // TODO: get guidance on implementation best practice
    // return () =>{
    //   if(abortController){
    //     // abortController.abort()
    //   }
    // }
  }, []);

  // Initial capabilities check
  useEffect(() => {
    checkCapabilities();
  }, [checkCapabilities]);

  const startDownload = useCallback(async () => {
    // Add additional checks before starting download
    if (!window.ai?.languageModel?.create) {
      setError(
        new AIDownloadError(
          'Language Model API not available',
          'DOWNLOAD_FAILED',
        ),
      );
      return;
    }

    if (available !== 'after-download') {
      console.log('here');
      setError(
        new AIDownloadError(
          'Download not required in current state',
          'DOWNLOAD_FAILED',
        ),
      );
      return;
    }

    if (isDownloading) {
      return; // Prevent multiple simultaneous downloads
    }

    setIsDownloading(true);
    setError(null);

    const controller = new AbortController();
    setAbortController(controller);

    let tempSession: AILanguageModel | null = null;
    try {
      tempSession = await window.ai.languageModel.create({
        signal: controller.signal,
        monitor: (monitor) => {
          monitor.addEventListener('downloadprogress', (event) => {
            setDownloadProgress({
              loaded: event.loaded,
              total: event.total,
            });
          });
        },
      });
      // Recheck capabilities after download
      await checkCapabilities();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError(
          new AIDownloadError('Download cancelled', 'DOWNLOAD_CANCELLED'),
        );
      } else {
        setError(
          new AIDownloadError(
            err instanceof Error ? err.message : 'Download failed',
            'DOWNLOAD_FAILED',
          ),
        );
      }
    } finally {
      if (tempSession) {
        tempSession.destroy();
      }
      setIsDownloading(false);
      setDownloadProgress(null);
      setAbortController(null);
    }
  }, [available, checkCapabilities]);

  const cancelDownload = useCallback(() => {
    abortController?.abort();
  }, [abortController]);

  const supportsLanguage = useCallback(
    (
      languageTag: Intl.UnicodeBCP47LocaleIdentifier,
    ): AICapabilityAvailability => {
      return capabilities?.languageAvailable(languageTag) ?? 'no';
    },
    [capabilities],
  );

  const value: AICapabilitiesResult = {
    available,
    capabilities,
    error,
    downloadProgress,
    isDownloading,
    supportsLanguage,
    defaultTemperature: capabilities?.defaultTemperature ?? null,
    defaultTopK: capabilities?.defaultTopK ?? null,
    maxTopK: capabilities?.maxTopK ?? null,
    startDownload,
    cancelDownload,
  };
  return (
    <AICapabilitiesContext.Provider value={value} >
      {children}
    </AICapabilitiesContext.Provider>
  );
}

export function useAICapabilities() {
  const context = useContext(AICapabilitiesContext);
  if (!context) {
    throw new Error('useAICapabilities must be used within AICapabilitiesProvider');
  }
  return context;
}
