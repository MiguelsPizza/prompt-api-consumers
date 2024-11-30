// import Dexie, { type EntityTable } from 'dexie';

// interface Conversation {
//   id: number;
//   name: string;
//   conversation_summary: string | null;
//   system_prompt: string | null;
//   created_at: Date;
//   updated_at: Date;
//   top_k: number | null;
//   temperature: number | null;
// }

// interface ConversationMessage {
//   id: number;
//   conversation: number;
//   position: number;
//   role: AILanguageModelPromptRole;
//   content: string;
//   created_at: Date;
//   updated_at: Date;
//   temperature_at_creation: number | null;
//   top_k_at_creation: number | null;
// }

// const db = new Dexie('sessionDatabase') as Dexie & {
//   conversation: EntityTable<
//     Conversation,
//     'id' // primary key "id" (for the typings only)
//   >;
//   conversationMessage: EntityTable<ConversationMessage, 'id'>;
// };

// // Schema declaration:
// db.version(1).stores({
//   conversation:
//     '++id, name, conversation_summary, system_prompt, created_at, updated_at, top_k, temperature',
//   conversationMessage:
//     '++id, conversation, position, role, content, created_at, updated_at, temperature_at_creation, top_k_at_creation',
// });

// export type { Conversation, ConversationMessage };
// export { db };
