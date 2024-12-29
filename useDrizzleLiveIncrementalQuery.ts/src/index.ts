import * as React from 'react';
import {
  type QueryClient,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { type DrizzleQueryType } from '@makisuo/pglite-drizzle';
import { useDrizzleLiveIncremental } from '@makisuo/pglite-drizzle/react';
/**
 * Example: Wrap drizzle's incremental live query in React Query. The data is kept
 * in sync by drizzle, while React Query provides caching & prefetching (including suspense).
 *
 * @param queryKey - The React Query "query key" to read/write from the cache.
 * @param diffKey - The record identifier used to track incremental updates (often a table's primary key).
 * @param drizzleQuery - A compiled drizzle query (select/insert/update or relational).
 * @param options - Standard React Query options to further manage caching, staleness, side effects, etc.
 */
export function useDrizzleLiveIncrementalQuery<
  TData = unknown,
  TError = unknown,
>(
  queryKey: unknown[],
  diffKey: string,
  drizzleQuery: DrizzleQueryType,
  options?: UseQueryOptions<TData, TError>,
): UseQueryResult<TData, TError> {
  const queryClient = useQueryClient();

  // 1) Let drizzle handle the "live" subscription
  //    This will cause a re-render whenever the underlying data changes.
  const {
    data: drizzleResult,
    affectedRows,
    fields,
    blob,
  } = useDrizzleLiveIncremental(diffKey, drizzleQuery);

  // 2) Sync up with React Query's cache so that other parts of the app
  //    can also "see" this fresh data.
  React.useEffect(() => {
    // Whenever the drizzle query data changes,
    // store it in React Query's cache under this queryKey.
    queryClient.setQueryData(queryKey, drizzleResult);
  }, [drizzleResult, queryKey, queryClient]);

  // 3) Now read back from the query cache (including any status fields)
  //    so we can integrate with React Query's workflow for loading, caching, etc.
  const state = queryClient.getQueryState<TData, TError>(queryKey);

  // If your drizzle data will always be "eagerly" available, you might consider
  // defaulting to drizzleResult when the cache is empty.
  const data = (state?.data as TData) ?? (drizzleResult as unknown as TData);

  // 4) Construct a typical UseQueryResult-like object
  //    You can expand on these fields as needed:
  const result: UseQueryResult<TData, TError> = {
    data,
    error: state?.error ?? null,
    // We treat the query as loading if we have neither drizzle output nor a cached result
    isLoading: !state || state.status === 'pending',
    isSuccess: !!data && (!state || state.status === 'success'),
    isError: state?.status === 'error',
    status: state?.status ?? 'pending',
    // If you'd like to expose drizzle's metadata through React Query,
    // you can store them in the cache or attach them here:
    // e.g. meta: { affectedRows, fields, blob }
  };

  return result;
}
