/**
 * Experimental TanStack Query integration for ElectricSQL + Drizzle, inspired by PowerSync's approach.
 *
 * These hooks wrap ElectricSQL's live queries (useDrizzleLive, useDrizzleLiveIncremental) in TanStack Query
 * so that you can benefit from caching, suspense, and additional TanStack Query features.
 *
 * @example
 * ```tsx
 * // In your top-level file (e.g., App.tsx):
 * import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 *
 * const App = () => {
 *   const queryClient = React.useMemo(() => new QueryClient(), []);
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourComponents />
 *     </QueryClientProvider>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Example usage:
 * import { useDrizzleTanstackLive } from "./react-tanstack";
 *
 * function MyComponent() {
 *   // "queryKey" is used for caching & invalidation in TanStack Query
 *   // "drizzleQuery" is the DrizzleORM/ElectricSQL query object you would normally pass to useDrizzleLive
 *   const { data, isLoading, error } = useDrizzleTanstackLive({
 *     queryKey: ["users", "byId", 1],
 *     drizzleQuery: db => db.select().from(schema.users).where(eq(schema.users.id, 1)),
 *   });
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {(error as Error).message}</p>;
 *   return <pre>{JSON.stringify(data, null, 2)}</pre>;
 * }
 * ```
 */

import {
  useQueryClient,
  useQuery as useTanstackQuery,
  useSuspenseQuery as useTanstackSuspenseQuery,
  type QueryClient,
  type UseQueryOptions,
  type UseQueryResult,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query';
import * as React from 'react';
import type { DrizzleQueryType } from './index';
import { useDrizzleLive, useDrizzleLiveIncremental } from './react';

/**
 * Shared options for wrapping Drizzle live queries with TanStack Query.
 */
export interface UseDrizzleTanstackOptions<TData>
  extends Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'> {
  /**
   * The "queryKey" used by TanStack Query for caching and invalidation.
   */
  queryKey: readonly unknown[];

  /**
   * A callback that receives the typed drizzle database instance and returns a Drizzle query
   * or the Drizzle query object itself. This is what you'd normally pass to:
   *   useDrizzleLive((db) => db.select().from(schema.users))
   */
  drizzleQuery: DrizzleQueryType | ((...args: any[]) => DrizzleQueryType);

  /**
   * If using incremental live queries, specify the "diffKey" used for incremental changes.
   */
  diffKey?: string;
}

/**
 * A core function that wraps either useDrizzleLive or useDrizzleLiveIncremental in TanStack Query.
 * This is not exported directly; use "useDrizzleTanstackLive" or "useDrizzleTanstackLiveIncremental" instead.
 */
function useDrizzleTanstackCore<TData>(
  options: UseDrizzleTanstackOptions<TData>,
  queryClient: QueryClient,
  useSuspense: boolean,
  incremental: boolean,
): UseQueryResult<TData> | UseSuspenseQueryResult<TData> {
  const { queryKey, drizzleQuery, diffKey, ...tanstackOptions } = options;

  // Resolve drizzleQuery if it's a function
  const resolvedQuery = React.useMemo<DrizzleQueryType>(() => {
    return typeof drizzleQuery === 'function'
      ? (drizzleQuery as any)()
      : drizzleQuery;
  }, [drizzleQuery]);

  // Retrieve data from ElectricSQL's live queries
  const liveResult = incremental
    ? useDrizzleLiveIncremental(diffKey!, resolvedQuery)
    : useDrizzleLive(resolvedQuery);

  const { data: electricData } = liveResult;

  // Memoize the queryFn to prevent unnecessary updates
  const queryFn = React.useCallback(async (): Promise<TData> => {
    return electricData as TData;
  }, [electricData]);

  // Only update cache if data has changed
  React.useEffect(() => {
    if (electricData !== undefined) {
      const cached = queryClient.getQueryData<TData>(queryKey);
      if (JSON.stringify(cached) !== JSON.stringify(electricData)) {
        queryClient.setQueryData<TData>(queryKey, electricData as TData);
      }
    }
  }, [electricData, queryKey, queryClient]);

  const queryOptions = {
    ...(tanstackOptions as any),
    queryKey,
    queryFn,
    initialData: electricData,
    // Prevent unnecessary refetches since ElectricSQL handles live updates
    staleTime: Infinity,
    // Only refetch on mount if we don't have data
    refetchOnMount: !electricData,
    // Disable automatic background refetches
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  };

  if (useSuspense) {
    return useTanstackSuspenseQuery<TData>(
      queryOptions,
    ) as UseSuspenseQueryResult<TData>;
  } else {
    return useTanstackQuery<TData>(queryOptions);
  }
}

/**
 * A hook that wraps ElectricSQL's useDrizzleLive with TanStack Query, returning
 * a standard TanStack query result. This means you get both reactivity from ElectricSQL
 * AND TanStack Query features like caching, staleTime, or suspending (if you prefer).
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDrizzleTanstackLive({
 *   queryKey: ["users"],
 *   drizzleQuery: db => db.select().from(schema.users),
 *   staleTime: 10000,
 * });
 * ```
 */
export function useDrizzleTanstackLive<TData = unknown>(
  options: UseDrizzleTanstackOptions<TData>,
  queryClient: QueryClient = useQueryClient(),
): UseQueryResult<TData> {
  return useDrizzleTanstackCore<TData>(
    options,
    queryClient,
    false,
    false,
  ) as UseQueryResult<TData>;
}

/**
 * Same as useDrizzleTanstackLive, but uses TanStack Query's suspense mode.
 * If you want React to suspend while data is loading, use this hook.
 *
 * @example
 * ```tsx
 * const { data } = useDrizzleTanstackLiveSuspense({
 *   queryKey: ["users"],
 *   drizzleQuery: db => db.select().from(schema.users),
 * });
 * // in a parent component:
 * // <Suspense fallback={<div>Loading...</div>}></Suspense>
 * ```
 */
export function useDrizzleTanstackLiveSuspense<TData = unknown>(
  options: UseDrizzleTanstackOptions<TData>,
  queryClient: QueryClient = useQueryClient(),
): UseSuspenseQueryResult<TData> {
  return useDrizzleTanstackCore<TData>(
    options,
    queryClient,
    true,
    false,
  ) as UseSuspenseQueryResult<TData>;
}

/**
 * A hook that wraps ElectricSQL's useDrizzleLiveIncremental in TanStack Query.
 * This is useful for incremental updates, especially if you have a large dataset
 * you want to keep "live" while still benefiting from TanStack Query's caching features.
 *
 * @example
 * ```tsx
 * const { data } = useDrizzleTanstackLiveIncremental({
 *   queryKey: ["largeDataTable"],
 *   drizzleQuery: db => db.select().from(schema.largeTable),
 *   diffKey: "id", // must match the unique key used for incremental updates
 * });
 * ```
 */
export function useDrizzleTanstackLiveIncremental<TData = unknown>(
  options: UseDrizzleTanstackOptions<TData> & { diffKey: string },
  queryClient: QueryClient = useQueryClient(),
): UseQueryResult<TData> {
  return useDrizzleTanstackCore<TData>(
    options,
    queryClient,
    false,
    true,
  ) as UseQueryResult<TData>;
}

/**
 * Same as useDrizzleTanstackLiveIncremental, but in TanStack Query's suspense mode.
 */
export function useDrizzleTanstackLiveIncrementalSuspense<TData = unknown>(
  options: UseDrizzleTanstackOptions<TData> & { diffKey: string },
  queryClient: QueryClient = useQueryClient(),
): UseSuspenseQueryResult<TData> {
  return useDrizzleTanstackCore<TData>(
    options,
    queryClient,
    true,
    true,
  ) as UseSuspenseQueryResult<TData>;
}
