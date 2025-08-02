import { CreateChromeContextOptions } from '@/chromeTrpcAdditions/trpc-browser/adapter';
import { MLCEngine } from '@mlc-ai/web-llm';
import { createEngine } from '../modelEngines/mlcEngine';
import { ServiceWorkerKeepAlive } from '../swKeepAlive';

let engine: MLCEngine


export const createContext = async (opts: CreateChromeContextOptions) => {
  engine = engine || createEngine(opts);
  const keeper = new ServiceWorkerKeepAlive();
  return {
    chatEngine: engine,
    keeper,
    tabId: opts.req.sender?.tab?.id
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;