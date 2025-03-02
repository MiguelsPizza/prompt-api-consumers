import { initTRPC } from '@trpc/server';
import { Context } from './routerContext';

console.log('[Background] Initializing tRPC...');
export const t = initTRPC.context<Context>().create({
  isServer: false,
  allowOutsideOfServer: true,
});
