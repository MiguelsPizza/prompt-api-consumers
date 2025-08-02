import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

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
  implements IAICapabilityError
{
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
  implements IAIDownloadError
{
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
  available: Availability;
  params: LanguageModelParams | null;
  error: UseAICapabilitiesError | null;

  // Download progress
  downloadProgress: { loaded: number; total: number } | null;
  isDownloading: boolean;

  // Model capabilities
  defaultTemperature: number | null;
  defaultTopK: number | null;
  maxTopK: number | null;
  maxTemperature: number | null;

  // Download trigger
  startDownload: () => Promise<void>;
  cancelDownload: () => void;
}

const AICapabilitiesContext = createContext<AICapabilitiesResult | null>(null);

export function AICapabilitiesProvider({ children }: PropsWithChildren) {
  const [available, setAvailable] = useState<Availability>('unavailable');
  const [params, setParams] = useState<LanguageModelParams | null>(null);
  const [error, setError] = useState<UseAICapabilitiesError | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    loaded: number;
    total: number;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const checkCapabilities = useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      typeof LanguageModel === 'undefined' ||
      !LanguageModel.params
    ) {
      setAvailable('unavailable');
      setError(
        new AICapabilityError(
          'Language Model API not available',
          'API_UNAVAILABLE',
        ),
      );
      return;
    }

    try {
      const modelParams = await LanguageModel.params();
      setParams(modelParams);

      // Check availability separately
      const availability = await LanguageModel.availability();
      setAvailable(availability);
      setError(null); // Clear any previous errors on success
    } catch (err) {
      setAvailable('unavailable'); // Set availability to no on error
      setParams(null); // Clear capabilities on error
      setError(
        new AICapabilityError(
          err instanceof Error ? err.message : 'Failed to check capabilities',
          'CAPABILITY_CHECK_FAILED',
        ),
      );
    }
  }, []);

  // Initial capabilities check
  useEffect(() => {
    checkCapabilities();
  }, [checkCapabilities]);

  const startDownload = useCallback(async () => {
    if (!LanguageModel || !LanguageModel.create) {
      setError(
        new AIDownloadError(
          'Language Model API not available',
          'DOWNLOAD_FAILED',
        ),
      );
      return;
    }

    if (available !== 'downloadable') {
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

    let tempSession: LanguageModel | null = null;
    try {
      tempSession = await LanguageModel.create({
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
  }, [available, checkCapabilities, isDownloading]);

  const cancelDownload = useCallback(() => {
    abortController?.abort();
  }, [abortController]);

  const value: AICapabilitiesResult = {
    available,
    params,
    error,
    downloadProgress,
    isDownloading,
    defaultTemperature: params?.defaultTemperature ?? null,
    defaultTopK: params?.defaultTopK ?? null,
    maxTopK: params?.maxTopK ?? null,
    maxTemperature: params?.maxTemperature ?? null,
    startDownload,
    cancelDownload,
  };
  return (
    <AICapabilitiesContext.Provider value={value}>
      {children}
    </AICapabilitiesContext.Provider>
  );
}

export function useAICapabilities() {
  const context = useContext(AICapabilitiesContext);
  if (!context) {
    throw new Error(
      'useAICapabilities must be used within AICapabilitiesProvider',
    );
  }
  return context;
}