import { CreateChromeContextOptions } from '@/chromeTrpcAdditions/trpc-browser/adapter';
import { MLCEngine } from '@mlc-ai/web-llm';
import { createEngine } from '../modelEngines/mlcEngine';

let engine: MLCEngine

export const createContext = async (opts: CreateChromeContextOptions) => {
  // console.log(EventEmitter)
  // const ee = new EventEmitter<EEeventTypes>({ debug: { name: 'EE', enabled: true } });
  engine = engine ?? createEngine(opts);

  console.log('[Background] Context creation completed successfully');
  return {
    chatEngine: engine,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;