import { z } from 'zod';
import { ZSupportedLLMModel } from './supportedModels';


/**
 * Host URL (e.g., a website or environment) where the conversation took place.
 * Can be either 'popup', 'content-script', or a valid webpage URL.
 */
export const hostURLSchema = z.union([
  z.literal('popup'),
  z.literal('content-script'),
  z.string().url()
])

export type HostURL = 'popup' | 'content-script' | `https://${string}` | `http://${string}`

/**
 * SessionMessageSchema:
 * Stores all messages (system, user, assistant), including any historically "initial" prompts.
 * If a message was originally a "systemPrompt," it's just another message with role = 'system'.
 */
export const SessionMessageSchema = z.object({
  /**
   * Unique ID for this message. Optional if the database generates it.
   */
  id: z.string().uuid(),

  /**
   * The session to which this message belongs.
   */
  session_id: z.string(),

  /**
   * The position (index) of this message in the sequence of all session messages.
   */
  position: z.number(),

  /**
   * The role of this message (user input, assistant reply, or system directive).
   */
  role: z.enum(['user', 'assistant', 'system']),

  /**
   * The textual content of this message.
   */
  content: z.string(),

  /**
   * The temperature parameter used when this message was generated.
   */
  temperature_at_creation: z.number(),

  /**
   * The top-k parameter used when this message was generated.
   */
  top_k_at_creation: z.number(),

  /**
   * Which LLM ID was used to generate this message, if it exists.
   */
  llm_id_at_creation: z.string().optional(),

  /**
   * Host URL (e.g., a website or environment) where the conversation took place.
   */
  hostURL: hostURLSchema,

  /**
   * Timestamp for when this message was created, if recorded.
   */
  created_at: z.string().optional(),

  /**
   * Timestamp for when this message was last updated, if recorded.
   */
  updated_at: z.string().optional(),
});

/**
 * Combines session-level data with associated prompts into a single schema.
 */
export const BaseSessionSchema = z.object({
  /**
   * Unique identifier for the session.
   */
  id: z.string().uuid(),

  /**
   * Human-readable name for the session.
   */
  name: z.string().optional().default('New Session'),

  /**
   * Optional summary of the session's content or purpose.
   */
  session_summary: z.string().optional(),

  /**
   * URL where the session is hosted or initiated.
   */
  hostURL: hostURLSchema,

  /**
   * The chosen LLM (Large Language Model) or extension used in this session.
   */
  llm_id: z.union([
    z.enum(['chrome-ai']),
    ZSupportedLLMModel,
  ]),

  /**
   * An array of system prompts (e.g., system instructions that further guide the assistant).
   */
  system_prompt: z.string().optional(),

  /**
   * Temperature controls the randomness of the model's outputs.
   * - Range: 0.0 to 1.0
   * - Lower values (e.g., 0.2) make responses more focused and deterministic
   * - Higher values (e.g., 0.8) make responses more creative and diverse
   * - Default: 0.7
   */
  temperature: z.number().min(0).max(1).default(0.7),

  /**
   * Top-k is a sampling parameter that limits the cumulative probability mass of tokens
   * considered for each step of text generation.
   * - Range: 1 to 100
   * - Lower values (e.g., 10) make responses more focused on highly probable tokens
   * - Higher values (e.g., 50) allow for more diverse word choices
   * - Default: 40
   *
   * For example, if top_k is 10, only the 10 most likely next tokens are considered
   * at each step of generation, and the rest are filtered out before temperature
   * sampling occurs.
   */
  top_k: z.number().min(1).max(100).default(40),

  /**
   * Timestamp for when the session was created, if recorded.
   */
  created_at: z.string().optional(),

  /**
   * Timestamp for when the session was last updated, if recorded.
   */
  updated_at: z.string().optional(),
});

/**
 * Combines session-level data with associated prompts into a single schema.
 */
export const SessionSchema = BaseSessionSchema.extend({
  /**
   * An array of the session's initial prompts (commonly user-provided at the start).
   */
  initial_prompts: z.array(SessionMessageSchema).optional().default([]),
});


export const ActiveSessionsSchema = z.array(z.object({
  sessionId: z.string().uuid(),
  hostURL: hostURLSchema
}))

export type ActiveSessions = z.infer<typeof ActiveSessionsSchema>

/** The TypeScript type inferred from the CombinedSessionSchema. */
export type CombinedSession = z.infer<typeof SessionSchema>;

// Infer TypeScript types from Zod
export type Session = z.infer<typeof SessionSchema>;
export type BaseSession = z.infer<typeof BaseSessionSchema>;

export type SessionMessage = z.infer<typeof SessionMessageSchema>;


export type RegularMessage = Omit<SessionMessage, 'role'> & { role: 'user' | 'assistant' }



/**
 * Helper function to create a valid SessionMessage from user input
 */
export function createSessionMessage(content: string, role: 'user' | 'assistant', session: BaseSession, position: number) {
  return SessionMessageSchema.parse({
    id: crypto.randomUUID(),
    session_id: session.id,
    position,
    role,
    content,
    temperature_at_creation: session.temperature,
    top_k_at_creation: session.top_k,
    llm_id_at_creation: session.llm_id,
    hostURL: session.hostURL,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }) as RegularMessage;
}

export type SystemPromptMessage = Omit<SessionMessage, 'role'> & { role: 'system' }
/**
 * Helper function to create a valid SessionMessage for system prompts
 */
export function createSystemMessage(content: string, session: BaseSession) {
  return SessionMessageSchema.parse({
    id: crypto.randomUUID(),
    session_id: session.id,
    role: 'system',
    position: -1,
    content,
    temperature_at_creation: session.temperature,
    top_k_at_creation: session.top_k,
    llm_id_at_creation: session.llm_id,
    hostURL: session.hostURL,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }) as SystemPromptMessage;
}