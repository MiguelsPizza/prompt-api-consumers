import Dexie, { Table } from 'dexie';
import { BaseSession, BaseSessionSchema, SessionMessage, SessionMessageSchema } from './sessionSchema';


export class SessionArchiveDB extends Dexie {
  sessions!: Table<BaseSession, string>;
  session_messages!: Table<SessionMessage, string>;

  constructor() {
    super('SessionArchiveDB');

    const sessionKeys = Object.keys(BaseSessionSchema.shape).join(',');
    const messageKeys = Object.keys(SessionMessageSchema.shape).join(',');

    this.version(1).stores({
      sessions: sessionKeys,
      session_messages: messageKeys
    });
  }
}

export const db = new SessionArchiveDB();

