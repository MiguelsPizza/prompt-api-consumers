import {
  AbstractPowerSyncDatabase,
  BaseObserver,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType
} from '@powersync/web';

import { Session, SupabaseClient, createClient } from '@supabase/supabase-js';

export type SupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  powersyncUrl: string;
};

/// Postgres Response codes that we cannot recover from by retrying.
const FATAL_RESPONSE_CODES = [
  // Class 22 — Data Exception
  // Examples include data type mismatch.
  new RegExp('^22...$'),
  // Class 23 — Integrity Constraint Violation.
  // Examples include NOT NULL, FOREIGN KEY and UNIQUE violations.
  new RegExp('^23...$'),
  // INSUFFICIENT PRIVILEGE - typically a row-level security violation
  new RegExp('^42501$')
];

export type SupabaseConnectorListener = {
  initialized: () => void;
  sessionStarted: (session: Session) => void;
};

export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

export class SupabaseConnector extends BaseObserver<SupabaseConnectorListener> implements PowerSyncBackendConnector {
  readonly client: SupabaseClient;
  readonly config: SupabaseConfig;

  ready: boolean;

  currentSession: Session | null;

  hasCredentials: boolean;

  constructor() {
    super();
    console.debug('SupabaseConnector: Initializing with config');
    this.config = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      powersyncUrl: import.meta.env.VITE_POWERSYNC_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    };
    console.debug('SupabaseConnector: Config loaded:', this.config);

    this.client = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      auth: {
        persistSession: true
      }
    });
    console.debug('SupabaseConnector: Supabase client created');
    this.currentSession = null;
    this.ready = false;

    this.hasCredentials = !(
      this.config.supabaseUrl == 'https://foo.supabase.co' ||
      this.config.powersyncUrl == 'https://foo.powersync.journeyapps.com'
    );
    console.debug('SupabaseConnector: Has credentials:', this.hasCredentials);
  }

  async init() {
    console.debug('SupabaseConnector: Initializing');
    if (this.ready) {
      console.debug('SupabaseConnector: Already initialized, skipping');
      return;
    }

    console.debug('SupabaseConnector: Getting session');
    const sessionResponse = await this.client.auth.getSession();
    console.debug('SupabaseConnector: Session response:', sessionResponse);
    this.updateSession(sessionResponse.data.session);

    this.ready = true;
    console.debug('SupabaseConnector: Initialization complete');
    this.iterateListeners((cb) => cb.initialized?.());
  }

  async login(username: string, password: string) {
    console.debug('SupabaseConnector: Attempting login for user:', username);
    const {
      data: { session },
      error
    } = await this.client.auth.signInWithPassword({
      email: username,
      password: password
    });

    if (error) {
      console.error('SupabaseConnector: Login failed:', error);
      throw error;
    }

    console.debug('SupabaseConnector: Login successful');
    this.updateSession(session);
  }

  async signup(email: string, password: string, options?: { data: { name: string } }) {
    console.debug('SupabaseConnector: Attempting signup for user:', email);
    const {
      data: { session },
      error
    } = await this.client.auth.signUp({
      email,
      password,
      options
    });

    if (error) {
      console.error('SupabaseConnector: Signup failed:', error);
      throw error;
    }

    console.debug('SupabaseConnector: Signup successful');
    this.updateSession(session);
  }

  async logout() {
    console.debug('SupabaseConnector: Logging out');
    await this.client.auth.signOut();
    console.debug('SupabaseConnector: Logout complete');
    this.updateSession(null);
  }

  async fetchCredentials() {
    console.debug('SupabaseConnector: Fetching credentials');
    const {
      data: { session },
      error
    } = await this.client.auth.getSession();

    if (!session || error) {
      console.error('SupabaseConnector: Failed to fetch credentials:', error);
      throw new Error(`Could not fetch Supabase credentials: ${error}`);
    }

    console.debug('SupabaseConnector: Session expires at:', session.expires_at);

    const credentials = {
      endpoint: this.config.powersyncUrl,
      token: session.access_token ?? '',
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined
    };
    console.debug('SupabaseConnector: Credentials fetched:', credentials);
    return credentials;
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    console.debug('SupabaseConnector: Starting data upload');
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      console.debug('SupabaseConnector: No transaction to upload');
      return;
    }

    console.debug('SupabaseConnector: Processing transaction:', transaction);
    let lastOp: CrudEntry | null = null;
    try {
      // Note: If transactional consistency is important, use database functions
      // or edge functions to process the entire transaction in a single call.
      for (const op of transaction.crud) {
        lastOp = op;
        console.debug('SupabaseConnector: Processing operation:', op);
        const table = this.client.from(op.table);
        let result: any;
        switch (op.op) {
          case UpdateType.PUT:
            const record = { ...op.opData, id: op.id };
            console.debug('SupabaseConnector: Upserting record:', record);
            result = await table.upsert(record);
            break;
          case UpdateType.PATCH:
            console.debug('SupabaseConnector: Patching record:', op.id, op.opData);
            result = await table.update(op.opData).eq('id', op.id);
            break;
          case UpdateType.DELETE:
            console.debug('SupabaseConnector: Deleting record:', op.id);
            result = await table.delete().eq('id', op.id);
            break;
        }

        if (result.error) {
          console.error('SupabaseConnector: Operation failed:', result.error);
          result.error.message = `Could not update Supabase. Received error: ${result.error.message}`;
          throw result.error;
        }
        console.debug('SupabaseConnector: Operation completed successfully:', result);
      }

      await transaction.complete();
      console.debug('SupabaseConnector: Transaction completed successfully');
    } catch (ex: any) {
      console.debug('SupabaseConnector: Error during upload:', ex);
      if (typeof ex.code == 'string' && FATAL_RESPONSE_CODES.some((regex) => regex.test(ex.code))) {
        /**
         * Instead of blocking the queue with these errors,
         * discard the (rest of the) transaction.
         *
         * Note that these errors typically indicate a bug in the application.
         * If protecting against data loss is important, save the failing records
         * elsewhere instead of discarding, and/or notify the user.
         */
        console.error('SupabaseConnector: Fatal data upload error - discarding:', lastOp, ex);
        await transaction.complete();
      } else {
        // Error may be retryable - e.g. network error or temporary server error.
        // Throwing an error here causes this call to be retried after a delay.
        console.error('SupabaseConnector: Retryable error during upload:', ex);
        throw ex;
      }
    }
  }

  updateSession(session: Session | null) {
    console.debug('SupabaseConnector: Updating session:', session);
    this.currentSession = session;
    if (!session) {
      console.debug('SupabaseConnector: Session cleared');
      return;
    }
    console.debug('SupabaseConnector: Notifying listeners of new session');
    this.iterateListeners((cb) => cb.sessionStarted?.(session));
  }
}
