import { chromeLink } from "@/chromeTrpcAdditions/trpc-browser/link";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCProxyClient, createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from "../background/routers";

/**
 * tRPC React client instance for making type-safe API calls to the background script
 * Provides strongly typed hooks for queries and mutations based on the AppRouter type
 */
export const trpc = createTRPCReact<AppRouter>();


/**
 * Chrome runtime port connection to the background script
 * Used for communication between the popup and background script
 */
export const port = chrome.runtime.connect();

/**
 * React Query client instance for managing server state and caching
 * Handles data fetching, caching, and synchronization
 */
export const queryClient = new QueryClient();

export const trpc_api = createTRPCProxyClient<AppRouter>({ links: [chromeLink({ port })] })

/**
 * Configured tRPC client instance with Chrome message port transport
 * Uses chromeLink to enable communication through Chrome runtime messaging
 */
export const trpcClient =
  trpc.createClient({
    links: [chromeLink({ port })],
  })

export interface RouterContext {
  queryClient: typeof queryClient
  trpc: typeof trpc_api
}
