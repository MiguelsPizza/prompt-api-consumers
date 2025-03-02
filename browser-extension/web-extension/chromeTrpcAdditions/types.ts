import { ProcedureType } from "@trpc/server";

interface TRPCMessageBase {
  id: number | string;
  jsonrpc?: '2.0';
  method: ProcedureType | 'subscription.stop';
}

/**
 * The shape of messages we pass back and forth (mirrors TRPCChromeRequest, etc.)
 */
export interface WindowRequest {
  trpc: TRPCMessageBase & {
    params?: {
      path: string;
      input: unknown;
    };
  };
}

export interface WindowResponse {
  trpc: TRPCMessageBase & {
    error?: unknown;
    result?: {
      type: 'data' | 'started' | 'stopped';
      data?: unknown;
    };
  };
}