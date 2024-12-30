import { type PGliteWithLive, live } from '@electric-sql/pglite/live';
import { useCallback, useEffect, useState } from 'react';

import { PGliteProvider } from '@electric-sql/pglite-react';

import PGWorker from '../../dataLayer/worker?worker';
import * as schema from '../../dataLayer/schema';

import { useAuth } from '@clerk/clerk-react';
import { PGliteWorker } from '@electric-sql/pglite/worker';
import { Loader } from 'lucide-react';
import { GlobalDrizzleDB } from '@/dataLayer';
import { drizzle } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import {
  createRouter,
  RouterProvider,
  useRouter,
} from '@tanstack/react-router';
import type { Session, User } from '@supabase/supabase-js';
import { routeTree } from '../../../routeTree.gen';

export interface RouterContext {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  db?: GlobalDrizzleDB;
  meta?: {
    title?: string;
    description?: string;
  };
}

const router = createRouter({
  routeTree,
  context: {
    session: null,
    user: null,
    isInitialized: false,
    isAuthenticated: false,
    db: undefined,
  },
});

export const SystemProvider = () => {
  const { getToken } = useAuth();

  const [pgForProvider, setPgForProvider] = useState<
    PGliteWithLive | undefined
  >(undefined);

  const [db, setDb] = useState<GlobalDrizzleDB | null>(null);

  const sendToken = useCallback(async () => {
    const bc = new BroadcastChannel('auth');
    bc.postMessage({ type: 'bearer', payload: await getToken() });
  }, [getToken]);

  useEffect(() => {
    const bc = new BroadcastChannel('auth');
    bc.onmessage = (event) => {
      if (event.data.type !== 'request') return;

      sendToken().then(() => console.log('SEND_TOKEN'));
    };

    return () => {
      bc.close();
    };
  }, [sendToken]);

  useEffect(() => {
    const loadPglite = async () => {
      const pgPromise = PGliteWorker.create(
        new PGWorker({ name: 'pglite-worker' }),
        {
          extensions: {
            live,
          },
        },
      );

      const pg = await pgPromise;
      await pg.waitReady;
      const newDb = drizzle(pg as unknown as PGlite, {
        schema,
        casing: 'snake_case',
      });
      setDb(newDb);

      return pg;
    };
    loadPglite().then(setPgForProvider);
  }, []);

  if (!pgForProvider || !db) return <Loader />;

  return (
    <PGliteProvider db={pgForProvider}>
      <RouterProvider
        router={router}
        context={{
          session: null,
          user: null,
          isInitialized: false,
          isAuthenticated: false,
          db,
        }}
      />
    </PGliteProvider>
  );
};

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
