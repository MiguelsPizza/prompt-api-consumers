import { CreateChromeContextOptions } from '@/chromeTrpcAdditions/trpc-browser/adapter';
import { MLCEngine } from '@mlc-ai/web-llm';
import { UUID } from 'crypto';
import EventEmitter from "emittery";
import { createEngine } from '../modelEngines/mlcEngine';
import { ServiceWorkerKeepAlive } from '../swKeepAlive';

let engine: MLCEngine

interface EEeventTypes {
  downloading: boolean
  destroy: UUID
}
export const createContext = async (opts: CreateChromeContextOptions) => {
  console.log("createContext", opts.req.sender?.id)
  // console.log(EventEmitter)
  const ee = new EventEmitter<EEeventTypes>({ debug: { name: 'EE', enabled: true } });
  engine = engine || createEngine(opts);
  const keeper = new ServiceWorkerKeepAlive();
  return {
    chatEngine: engine,
    ee,
    keeper,
    tabId: opts.req.sender?.tab?.id
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;