/**
 * AIPolyfill
 * ----------
 * Base type that can be extended. Each field is
 * expected to be at least an AI*Factory interface.
 */
export type AIPolyfill<
  Summarizer extends AISummarizerFactory,
  Writer extends AIWriterFactory,
  Rewriter extends AIRewriterFactory,
  Translator extends AITranslatorFactory,
  LanguageDetector extends AILanguageDetectorFactory,
  LanguageModel extends AILanguageModelFactory
> = {
  summarizer: Summarizer;
  writer: Writer;
  rewriter: Rewriter;
  translator: Translator;
  languageDetector: LanguageDetector;
  languageModel: LanguageModel;
};


/**
 * MergedAIPolyfill
 * ----------------
 * This conditional type enforces that if you provide a custom field
 * (e.g. `summarizer`), it must extend the corresponding base interface.
 * Otherwise, it falls back to the default type.
 */
export type MergedAIPolyfill<P> = {
  summarizer: P extends { summarizer: infer S }
  ? S extends AISummarizerFactory
  ? S
  : AISummarizerFactory
  : AISummarizerFactory;
  writer: P extends { writer: infer W }
  ? W extends AIWriterFactory
  ? W
  : AIWriterFactory
  : AIWriterFactory;
  rewriter: P extends { rewriter: infer R }
  ? R extends AIRewriterFactory
  ? R
  : AIRewriterFactory
  : AIRewriterFactory;
  translator: P extends { translator: infer T }
  ? T extends AITranslatorFactory
  ? T
  : AITranslatorFactory
  : AITranslatorFactory;
  languageDetector: P extends { languageDetector: infer LD }
  ? LD extends AILanguageDetectorFactory
  ? LD
  : AILanguageDetectorFactory
  : AILanguageDetectorFactory;
  languageModel: P extends { languageModel: infer LM }
  ? LM extends AILanguageModelFactory
  ? LM
  : AILanguageModelFactory
  : AILanguageModelFactory;
};