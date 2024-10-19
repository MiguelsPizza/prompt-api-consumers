// deno-lint-ignore-file no-window
// useLanguageModel.ts
// @ts-types="npm:@types/react@^18.3.11"
import { useEffect, useState } from "react";
import "npm:@types/dom-chromium-ai";

declare global {
  interface Window {
    ai: AI;
  }
}

/**
 * The result object returned by the useLanguageModel hook.
 */
export interface UseLanguageModelResult {
  /** The AI language model session, if successfully created */
  session: AILanguageModel | null;
  /** Indicates whether the session is currently loading */
  loading: boolean;
  /** The download progress of the model, if applicable */
  downloadProgress: number | null;
  /** Any error that occurred during session creation */
  error: Error | null;
}

/**
 * A custom React hook for creating and managing an AI language model session.
 *
 * This hook provides functionality to create an AI language model session,
 * manage its loading state, track download progress, and handle errors.
 *
 * @param options Optional AILanguageModelCreateOptions for customizing the session creation
 * @returns {UseLanguageModelResult} An object containing the session, loading state, download progress, and error state
 *
 * @example
 * // Using the hook in a component
 * const MyComponent = () => {
 *   const { session, loading, downloadProgress, error } = useLanguageModel();
 *
 *   if (loading) {
 *     return <p>Loading model... {downloadProgress !== null ? `${(downloadProgress * 100).toFixed(2)}%` : ''}</p>;
 *   }
 *
 *   if (error) {
 *     return <p>Error: {error.message}</p>;
 *   }
 *
 *   if (session) {
 *     return <p>Model loaded successfully!</p>;
 *   }
 *
 *   return null;
 * };
 */
export function useLanguageModel(
  options?: AILanguageModelCreateOptions,
): UseLanguageModelResult {
  const [session, setSession] = useState<AILanguageModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    setLoading(true);
    setError(null);
    setDownloadProgress(null);

    const monitor = (m: AICreateMonitor) => {
      m.addEventListener("downloadprogress", (e: DownloadProgressEvent) => {
        if (isMounted) {
          setDownloadProgress(e.loaded / e.total);
        }
      });
    };

    const createOptions: AILanguageModelCreateOptions = {
      ...(options || {}),
      signal: abortController.signal,
      monitor,
    };

    if (
      window.ai && window.ai.languageModel && window.ai.languageModel.create
    ) {
      window.ai.languageModel.create(createOptions).then((session) => {
        if (isMounted) {
          setSession(session);
          setLoading(false);
        }
      }).catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err : new Error("Unknown error occurred"),
          );
          setLoading(false);
        }
      });
    } else {
      if (isMounted) {
        setError(new Error("Language Model API not available"));
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [options]);

  return { session, loading, downloadProgress, error };
}
