import { AppSchema, conversationMessagesRelations, conversations, db, DB_NAME, makeSchema, switchToSyncedSchema } from '@/powersync/AppSchema';
import { SupabaseConnector } from '@/powersync/SupabaseConnector';
import { CircularProgress } from '@mui/material';
import { PowerSyncContext } from '@powersync/react';
import { PowerSyncDatabase } from '@powersync/web';
import Logger from 'js-logger';
import React, { Suspense } from 'react';
import { NavigationPanelContextProvider } from '../navigation/NavigationPanelContext';
import { getSyncEnabled } from '@/powersync/SyncMode';
import { powerSyncDb, conversationMessages } from '@/powersync/AppSchema';

const SupabaseContext = React.createContext<SupabaseConnector | null>(null);
export const useSupabase = () => React.useContext(SupabaseContext);
const connector = new SupabaseConnector()
export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
  const [powerSync] = React.useState(powerSyncDb);

  React.useEffect(() => {
    // Linting thinks this is a hook due to it's name
    Logger.useDefaults(); // eslint-disable-line
    Logger.setLevel(Logger.DEBUG);
    // For console testing purposes
    (window as any)._powersync = powerSync;

    powerSync.init();
    const l = connector.registerListener({
      initialized: () => { },
      sessionStarted: async () => {
        var isSyncMode = getSyncEnabled(DB_NAME);
        // Switch to sync mode if the user is logged in for first time
        if (!isSyncMode) {
          await db.transaction(async (transaction) => {
            await transaction.update(conversationMessages).set({ userId: connector.currentSession?.user.id! })
            await transaction.update(conversations).set({ userId: connector.currentSession?.user.id! })
          })
          // await switchToSyncedSchema(db, connector.currentSession?.user.id!);
        }
        powerSync.connect(connector);
      }
    });

    connector.init();

    return () => {
      l?.();
      powerSync?.close();
      (window as any)._powersync = null
    }
  }, [powerSync, connector]);

  return (
    <Suspense fallback={<CircularProgress />}>
      <PowerSyncContext.Provider value={powerSync}>
        <SupabaseContext.Provider value={connector}>
          <NavigationPanelContextProvider>{children}</NavigationPanelContextProvider>
        </SupabaseContext.Provider>
      </PowerSyncContext.Provider>
    </Suspense>
  );
};

export default SystemProvider;
