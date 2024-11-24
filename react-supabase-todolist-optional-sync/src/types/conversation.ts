export interface Conversation {
  id: number;
  name: string;
  conversation_summary: string | null;
  system_prompt: string | null;
  created_at: Date;
  updated_at: Date;
  top_k: number;
  temperature: number;
}