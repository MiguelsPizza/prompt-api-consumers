import { mockLanguageDetectorFactory } from "./mocks/language-detector";
import { defaultLanguageModelFactory } from "./mocks/language-model";
import { mockRewriterFactory } from "./mocks/rewriter";
import { mockSummarizerFactory } from "./mocks/summarizer";
import { mockTranslatorFactory } from "./mocks/translator";
import { mockWriterFactory } from "./mocks/writer";
import type { AIPolyfill, MergedAIPolyfill } from "./types/AIPolyfill";
import type { AIProviderInfo } from "./types/AIProviderInfo";
import type { AttachPolyfillOptions } from "./types/AttachPolyfillOptions";

/**
 * CreateAIPolyfillParams
 * ----------------------
 * Single-argument configuration interface for creating the AI polyfill.
 * Here the generic param is constrained so that any override must extend
 * the base factory interface it is replacing.
 */
export interface CreateAIPolyfillParams<
  P extends Partial<
    AIPolyfill<
      AISummarizerFactory,
      AIWriterFactory,
      AIRewriterFactory,
      AITranslatorFactory,
      AILanguageDetectorFactory,
      AILanguageModelFactory
    >
  >
> {
  info: AIProviderInfo;
  options: AttachPolyfillOptions;
  partialPolyfill: P;
}


/**
 * createWebAIPolyfill
 * -------------------
 * Attaches or re-attaches the polyfill to the global scope. By default,
 * if a partial Polyfill is provided, we selectively overlay those methods
 * on top of the existing or default mock AI methods.
 *
 * @param info - Basic information about your AI Provider
 * @param options - Lifecycle hooks for selection/deselection
 * @param partialPolyfill - Fields to override in the default mock implementations
 */
export function createWebAIPolyfill<
  P extends Partial<
    AIPolyfill<
      AISummarizerFactory,
      AIWriterFactory,
      AIRewriterFactory,
      AITranslatorFactory,
      AILanguageDetectorFactory,
      AILanguageModelFactory
    >
  >
>(params: CreateAIPolyfillParams<P>): MergedAIPolyfill<P> & {
  _meta: { info: AIProviderInfo; options: AttachPolyfillOptions };
} {
  const { info, options, partialPolyfill } = params;
  const nativeWindowAI = window.ai

  // Merge or default to existing or mock implementations
  const languageModel =
    partialPolyfill.languageModel ?? nativeWindowAI?.languageModel ?? defaultLanguageModelFactory;
  const summarizer =
    partialPolyfill.summarizer ?? nativeWindowAI?.summarizer ?? mockSummarizerFactory;
  const writer =
    partialPolyfill.writer ?? nativeWindowAI?.writer ?? mockWriterFactory;
  const rewriter =
    partialPolyfill.rewriter ?? nativeWindowAI?.rewriter ?? mockRewriterFactory;
  const translator =
    partialPolyfill.translator ?? nativeWindowAI?.translator ?? mockTranslatorFactory;
  const languageDetector =
    partialPolyfill.languageDetector ?? nativeWindowAI?.languageDetector ?? mockLanguageDetectorFactory;

  return {
    languageModel,
    summarizer,
    writer,
    rewriter,
    translator,
    languageDetector,
    _meta: {
      info,
      options,
    },
  } as MergedAIPolyfill<P> & {
    _meta: { info: AIProviderInfo; options: AttachPolyfillOptions };
  };
}


export type AIPolyfillWithMetaData = ReturnType<typeof createWebAIPolyfill>;