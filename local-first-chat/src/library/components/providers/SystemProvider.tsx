import React, { Suspense } from 'react';
import { Loader } from 'lucide-react';
import { PGliteProvider } from "@electric-sql/pglite-react"
import { db, pglite } from '@/powersync/AppSchema';
import { PGliteWithLive } from '@electric-sql/pglite/live';


export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
  // const [connector] = React.useState(new SupabaseConnector());
  // const [powerSync] = React.useState(powerSyncDb);

  // React.useEffect(() => {
  //   // Linting thinks this is a hook due to it's name
  //   Logger.useDefaults(); // eslint-disable-line
  //   Logger.setLevel(Logger.DEBUG);
  //   // For console testing purposes
  //   (window as any)._powersync = powerSync;

  //   powerSync.init();
  //   const l = connector.registerListener({
  //     initialized: () => {
  //       Logger.debug('SupabaseConnector initialized');
  //     },
  //     sessionStarted: async () => {
  //       console.log('hereinasf')
  //       console.log('Session started');
  //       var isSyncMode = getSyncEnabled();
  //       console.log('Current sync mode:', isSyncMode);
  //       console.log('SupabaseConnector initialized');
  //       // Switch to sync mode if the user is logged in for first time
  //       // if (!isSyncMode) {
  //       console.log('Switching to synced schema for user:', connector.currentSession?.user.id);
  //       await switchToSyncedSchema(connector.currentSession?.user.id!);
  //       // }
  //       console.log('Connecting PowerSync to Supabase connector');
  //       powerSync.connect(connector);
  //     }
  //   });

  //   connector.init();

  //   return () => l?.();
  // }, [powerSync, connector]);

  return (
    <Suspense fallback={<Loader />}>
      <PGliteProvider db={pglite}>
          {children}
          </PGliteProvider>
    </Suspense>
  );
};

export default SystemProvider;