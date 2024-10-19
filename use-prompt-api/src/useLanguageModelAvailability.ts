// deno-lint-ignore-file no-window
// useLanguageModelAvailability.ts
// @ts-types="npm:@types/react@^18.3.11"
import { useEffect, useState } from "react";
import "npm:@types/dom-chromium-ai";

declare global {
  interface Window {
    ai: AI;
  }
}

/**
 * A custom React hook for checking the availability and capabilities of an AI language model.
 *
 * This hook provides functionality to determine if an AI language model is available
 * and retrieve its capabilities.
 *
 * @returns An object containing the availability status, capabilities, loading state, and error state
 *
 * @example
 * // Using the hook in a component
 * const MyComponent = () => {
 *   const { available, capabilities, loading, error } = useLanguageModelAvailability();
 *
 *   if (loading) {
 *     return <p>Checking AI availability...</p>;
 *   }
 *
 *   if (error) {
 *     return <p>Error: {error.message}</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>AI Available: {available}</p>
 *       {capabilities && (
 *         <ul>
 *           <li>Model: {capabilities.model}</li>
 *           <li>Context Window: {capabilities.contextWindow}</li>
 *         </ul>
 *       )}
 *     </div>
 *   );
 * };
 */
export function useLanguageModelAvailability(): {
  /** The availability status of the AI language model */
  available: AICapabilityAvailability;
  /** The capabilities of the AI language model, if available */
  capabilities: AILanguageModelCapabilities | null;
  /** Indicates whether the availability check is in progress */
  loading: boolean;
  /** Any error that occurred during the availability check */
  error: Error | null;
} {
  const [available, setAvailable] = useState<AICapabilityAvailability>("no");
  const [capabilities, setCapabilities] = useState<
    AILanguageModelCapabilities | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    if (
      window.ai && window.ai.languageModel &&
      window.ai.languageModel.capabilities
    ) {
      window.ai.languageModel.capabilities().then((capabilities) => {
        if (isMounted) {
          setCapabilities(capabilities);
          setAvailable(capabilities.available);
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
        setAvailable("no");
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return { available, capabilities, loading, error };
}
