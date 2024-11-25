import { SupabaseConnector } from '@/powersync/SupabaseConnector';
import { CircularProgress } from '@mui/material';
import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase } from '@powersync/web';
import Logger from 'js-logger';
import React, { Suspense } from 'react';
import { NavigationPanelContextProvider } from '../navigation/NavigationPanelContext';
import { getSyncEnabled } from '@/powersync/SyncMode';
import { switchToSyncedSchema, makeSchema, AppSchema, db, powerSyncDb, DB_NAME } from '@/powersync/AppSchema';

const SupabaseContext = React.createContext<SupabaseConnector | null>(null);
export const useSupabase = () => React.useContext(SupabaseContext);

export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
  const [connector] = React.useState(new SupabaseConnector());
  const [powerSync] = React.useState(db);

  React.useEffect(() => {
    // Linting thinks this is a hook due to it's name
    Logger.useDefaults(); // eslint-disable-line
    Logger.setLevel(Logger.DEBUG);
    // For console testing purposes
    (window as any)._powersync = powerSync;

    powerSyncDb.init();
    const l = connector.registerListener({
      initialized: () => {},
      sessionStarted: async () => {
        var isSyncMode = getSyncEnabled(DB_NAME);

        // Switch to sync mode if the user is logged in for first time
        if (!isSyncMode) {
          await switchToSyncedSchema(db, connector.currentSession?.user.id!);
        }
        powerSyncDb.connect(connector);
      }
    });

    connector.init();

    return () => l?.();
  }, [powerSync, connector]);

  return (
    <Suspense fallback={<CircularProgress />}>
      <PowerSyncContext.Provider value={powerSyncDb}>
        <SupabaseContext.Provider value={connector}>
          <NavigationPanelContextProvider>{children}</NavigationPanelContextProvider>
        </SupabaseContext.Provider>
      </PowerSyncContext.Provider>
    </Suspense>
  );
};

export default SystemProvider;