import { ExtensionModelStore } from '@/entrypoints/background/lib/mlcIndexeddbUtils'
import { TRPCClientError } from '@trpc/client'
import { useCallback, useEffect, useState } from 'react'
import { trpc } from '../trpcClient'

interface UseModelsResult {
  models: ExtensionModelStore
  isLoading: boolean
  error: TRPCClientError<any> | null
  refetch: () => void
}

/**
 * Custom hook for managing model subscriptions and state
 *
 * This hook provides:
 * - Real-time model updates through TRPC subscription
 * - Loading state management
 * - Error handling
 * - Manual refetch capability
 *
 * @returns {UseModelsResult} Object containing models data, loading state, error state, and refetch function
 */
export function useModels(): UseModelsResult {
  const [models, setModels] = useState<ExtensionModelStore>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<TRPCClientError<any> | null>(null)

  // Set up the subscription
  trpc.models.listModels.useSubscription(undefined, {
    onStarted: () => {
      console.log('Started subscription to models')
      setIsLoading(true)
      setError(null)
    },
    onData: (data) => {
      console.log('Received model data update')
      setModels(data)
      setIsLoading(false)
    },
    onError: (err) => {
      console.error('Error in models subscription:', err)
      setError(err as TRPCClientError<any>)
      setIsLoading(false)
    },
    enabled: true, // Always keep the subscription enabled
  })

  // Cleanup function to reset state when component unmounts
  useEffect(() => {
    return () => {
      setModels({})
      setIsLoading(true)
      setError(null)
    }
  }, [])

  // Function to manually refetch by restarting the subscription
  const refetch = useCallback(() => {
    setIsLoading(true)
    setError(null)
    // Force a re-render to restart the subscription
    setModels({})
  }, [])

  return {
    models,
    isLoading,
    error,
    refetch,
  }
}