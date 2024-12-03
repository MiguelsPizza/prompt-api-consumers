import { SupabaseConnector } from '@/powersync/SupabaseConnector';
import { CircularProgress } from '@mui/material';
import { PowerSyncContext } from '@powersync/react';
import Logger from 'js-logger';
import React, { Suspense } from 'react';
import { getSyncEnabled } from '@/powersync/SyncMode';
import { switchToSyncedSchema, db, powerSyncDb } from '@/powersync/AppSchema';
import { SupabaseContext } from '@/utils/Contexts';

export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
  const [connector] = React.useState(new SupabaseConnector());
  const [powerSync] = React.useState(powerSyncDb);

  React.useEffect(() => {
    // Linting thinks this is a hook due to it's name
    Logger.useDefaults(); // eslint-disable-line
    Logger.setLevel(Logger.DEBUG);
    // For console testing purposes
    (window as any)._powersync = powerSync;

    powerSync.init();
    const l = connector.registerListener({
      initialized: () => {
        Logger.debug('SupabaseConnector initialized');
      },
      sessionStarted: async () => {
        console.log('hereinasf')
        console.log('Session started');
        var isSyncMode = getSyncEnabled();
        console.log('Current sync mode:', isSyncMode);
        console.log('SupabaseConnector initialized');
        // Switch to sync mode if the user is logged in for first time
        // if (!isSyncMode) {
        console.log('Switching to synced schema for user:', connector.currentSession?.user.id);
        await switchToSyncedSchema(connector.currentSession?.user.id!);
        // }
        console.log('Connecting PowerSync to Supabase connector');
        powerSync.connect(connector);
      }
    });

    connector.init();

    return () => l?.();
  }, [powerSync, connector]);

  return (
    <Suspense fallback={<CircularProgress />}>
      <PowerSyncContext.Provider value={powerSync}>
        <SupabaseContext.Provider value={connector}>
          {children}
        </SupabaseContext.Provider>
      </PowerSyncContext.Provider>
    </Suspense>
  );
};

export default SystemProvider;