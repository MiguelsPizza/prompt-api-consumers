import { z } from "zod";

/**
 * Based on the global definitions and interfaces from the spec:
 *
 * interface AILanguageModelPrompt {
 *   role: AILanguageModelPromptRole;
 *   content: string;
 * }
 *
 * type AILanguageModelPromptRole = "user" | "assistant";
 *
 * interface AILanguageModelInitialPrompt {
 *   role: AILanguageModelInitialPromptRole;
 *   content: string;
 * }
 *
 * type AILanguageModelInitialPromptRole = "system" | "user" | "assistant";
 *
 * interface AILanguageModelSystemPrompt extends AILanguageModelInitialPrompt {
 *   role: "system";
 * }
 *
 * interface AILanguageModelCreateOptions {
 *   signal?: AbortSignal;
 *   monitor?: AICreateMonitorCallback;
 *   topK?: number;
 *   temperature?: number;
 * }
 *
 * interface AILanguageModelCreateOptionsWithSystemPrompt extends AILanguageModelCreateOptions {
 *   systemPrompt?: string;
 *   initialPrompts?: AILanguageModelPrompt[];
 * }
 *
 * interface AILanguageModelCreateOptionsWithoutSystemPrompt extends AILanguageModelCreateOptions {
 *   systemPrompt?: never;
 *   initialPrompts?:
 *     | [AILanguageModelSystemPrompt, ...AILanguageModelPrompt[]]
 *     | AILanguageModelPrompt[];
 * }
 *
 * type AICapabilityAvailability = "readily" | "after-download" | "no";
 *
 * interface AILanguageModelCapabilities {
 *   readonly available: AICapabilityAvailability;
 *   languageAvailable(languageTag: Intl.UnicodeBCP47LocaleIdentifier): AICapabilityAvailability;
 *   readonly defaultTopK: number | null;
 *   readonly maxTopK: number | null;
 *   readonly defaultTemperature: number | null;
 * }
 *
 * This file provides Zod schemas to validate that objects match
 * the language model portion of the spec as closely as possible.
 */

/**
 * If you'd like stricter runtime checking for AbortSignal / AICreateMonitorCallback,
 * you can further refine these placeholders below.
 */
export const ZAbortSignal = z.any().describe("Represents an AbortSignal, validated loosely");
export const ZAICreateMonitorCallback = z.any().describe("Represents a callback function for AICreateMonitor");

/**
 * Enums where possible
 */
export const ZAILanguageModelPromptRole = z.enum(["user", "assistant"]);
export const ZAILanguageModelInitialPromptRole = z.enum(["system", "user", "assistant"]);
export const ZAICapabilityAvailability = z.enum(["readily", "after-download", "no"]);

/**
 * Prompt validators
 */
export const ZAILanguageModelPrompt = z.object({
  role: ZAILanguageModelPromptRole,
  content: z.string(),
});

export const ZAILanguageModelSystemPrompt = z.object({
  role: z.literal("system"),
  content: z.string(),
});

export const ZAILanguageModelInitialPrompt = z.object({
  role: ZAILanguageModelInitialPromptRole,
  content: z.string(),
});

/**
 * Base create options
 */
export const ZAILanguageModelCreateOptionsBase = z.object({
  signal: ZAbortSignal.optional(),
  monitor: ZAICreateMonitorCallback.optional(),
  topK: z.number().optional(),
  temperature: z.number().optional(),
});

/**
 * Create options variant: With system prompt
 */
export const ZAILanguageModelCreateOptionsWithSystemPrompt = ZAILanguageModelCreateOptionsBase.extend({
  systemPrompt: z.string().optional(),
  initialPrompts: z.array(ZAILanguageModelPrompt).optional(),
});

/**
 * Create options variant: Without system prompt
 *
 * For initialPrompts, the spec says:
 *   initialPrompts?:
 *     | [AILanguageModelSystemPrompt, ...AILanguageModelPrompt[]]
 *     | AILanguageModelPrompt[];
 *
 * Below we define a union that allows either:
 *   1) an array of any number of standard prompts, OR
 *   2) a tuple whose first item is a system prompt followed by any number of standard prompts.
 */
export const ZAILanguageModelCreateOptionsWithoutSystemPrompt = ZAILanguageModelCreateOptionsBase.extend({
  systemPrompt: z.never().optional(),
  initialPrompts: z.union([
    // [AILanguageModelSystemPrompt, ...AILanguageModelPrompt[]]
    z.tuple([ZAILanguageModelSystemPrompt]).rest(ZAILanguageModelPrompt),
    // AILanguageModelPrompt[]
    z.array(ZAILanguageModelPrompt),
  ]).optional(),
});

/**
 * Full union for validating create options:
 * You can use this to differentiate or to ensure an object
 * matches either one variant or the other.
 */
export const ZAILanguageModelCreateOptions = z.union([
  ZAILanguageModelCreateOptionsWithSystemPrompt,
  ZAILanguageModelCreateOptionsWithoutSystemPrompt,
]);

/**
 * Capabilities validator
 */
export const ZAILanguageModelCapabilities = z.object({
  available: ZAICapabilityAvailability,
  // For runtime, a method can't be strictly validated with Zod. We typically treat it as .any()
  // or possibly a function with a specific signature. Here we do:
  languageAvailable: z.any().describe(
    "Method signature: (languageTag: Intl.UnicodeBCP47LocaleIdentifier) => AICapabilityAvailability"
  ),
  defaultTopK: z.number().nullable(),
  maxTopK: z.number().nullable(),
  defaultTemperature: z.number().nullable(),
});



/**
 * ----------------------------------------------------------------------
 * Types inferred from Zod validators
 *
 * These alias the types that are automatically inferred by Zod. If the
 * spec changes and we update the Zod schemas, these inferred types will
 * update accordingly. This helps ensure runtime + compile-time parity.
 * ----------------------------------------------------------------------
 */
// export type TAILanguageModelPrompt = z.infer<typeof ZAILanguageModelPrompt>
// export type TAILanguageModelSystemPrompt = z.infer<typeof ZAILanguageModelSystemPrompt>;
// export type TAILanguageModelInitialPrompt = z.infer<typeof ZAILanguageModelInitialPrompt>;

// export type TAILanguageModelCreateOptionsBase = z.infer<typeof ZAILanguageModelCreateOptionsBase>;
// export type TAILanguageModelCreateOptionsWithSystemPrompt = z.infer<typeof ZAILanguageModelCreateOptionsWithSystemPrompt>;
// export type TAILanguageModelCreateOptionsWithoutSystemPrompt = z.infer<typeof ZAILanguageModelCreateOptionsWithoutSystemPrompt>;
// export type TAILanguageModelCreateOptions = z.infer<typeof ZAILanguageModelCreateOptions>;

// export type TAILanguageModelCapabilities = z.infer<typeof ZAILanguageModelCapabilities>;


//TODO: setup type tests to make sure these stay up to date with the chrome window.ai spec