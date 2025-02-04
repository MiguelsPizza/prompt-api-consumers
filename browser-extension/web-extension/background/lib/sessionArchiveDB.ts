import Dexie, { Table } from 'dexie';
import { BaseSession, BaseSessionSchema, SessionMessage, SessionMessageSchema } from './sessionSchema';

export class SessionArchiveDB extends Dexie {
  sessions!: Table<BaseSession, string>;
  session_messages!: Table<SessionMessage, string>;

  constructor() {
    super('SessionArchiveDB');

    const sessionKeys = Object.keys(BaseSessionSchema.shape).join(',');
    const messageKeys = Object.keys(SessionMessageSchema.shape).join(',');
    /**
     * Note: Dexie intentionally multiplies version numbers by 10 internally.
     * This was originally added to work around an IE upgrade issue, but remains
     * for backwards compatibility.
     * @see https://github.com/dexie/Dexie.js/issues/59
     */
    this.version(1).stores({
      sessions: sessionKeys,
      session_messages: messageKeys
    });
  }
}

export const db = new SessionArchiveDB();

