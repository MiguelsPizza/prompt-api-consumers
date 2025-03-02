import { type PGliteWithLive, live } from '@electric-sql/pglite/live';
import { useEffect, useState } from 'react';

import { PGliteProvider } from '@electric-sql/pglite-react';

import * as schema from '@local-first-web-ai-monorepo/schema/cloud';
import PGWorker from '../../dataLayer/worker?worker';

import { GlobalDrizzleDB } from '@/dataLayer';
import { PGlite } from '@electric-sql/pglite';
import { PGliteWorker } from '@electric-sql/pglite/worker';
import { RouterProvider } from '@tanstack/react-router';
import { drizzle } from 'drizzle-orm/pglite';
import { Loader2 } from 'lucide-react';
import router from '../../../router';

export function SystemProvider() {
  // const { getToken } = useAuth();

  const [pgForProvider, setPgForProvider] = useState<
    PGliteWithLive | undefined
  >(undefined);

  const [db, setDb] = useState<GlobalDrizzleDB | null>(null);
  const [user, setUser] = useState<schema.User | null>(null);

  // const sendToken = useCallback(async () => {
  //   const bc = new BroadcastChannel('auth');
  //   bc.postMessage({ type: 'bearer', payload: await getToken() });
  // }, [getToken]);

  // useEffect(() => {
  //   const bc = new BroadcastChannel('auth');
  //   bc.onmessage = (event) => {
  //     if (event.data.type !== 'request') return;

  //     sendToken().then(() => console.log('SEND_TOKEN'));
  //   };

  //   return () => {
  //     bc.close();
  //   };
  // }, [sendToken]);

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

      // setUser(userTemp!);
      return pg;
    };
    loadPglite().then(setPgForProvider);
  }, []);

  if (!pgForProvider || !db)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading app...</p>
        </div>
      </div>
    );

  return (
    <PGliteProvider db={pgForProvider}>
      <RouterProvider router={router} context={{ user, db }} />
    </PGliteProvider>
  );
}
