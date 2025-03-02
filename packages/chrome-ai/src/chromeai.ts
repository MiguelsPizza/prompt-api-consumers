import {
  ChromeAIChatLanguageModel,
  ChromeAIChatModelId,
  ChromeAIChatSettings,
} from './language-model';
import createDebug from 'debug';

const debug = createDebug('chromeai');

/**
 * Create a new ChromeAI model/embedding instance.
 * @param modelId 'text' | 'embedding'
 * @param settings Options for the model
 */
export function chromeai(
  modelId?: ChromeAIChatModelId,
  settings?: ChromeAIChatSettings,
): ChromeAIChatLanguageModel;

export function chromeai(modelId: unknown = 'text', settings: unknown = {}) {
  debug('create instance', modelId, settings);
  return new ChromeAIChatLanguageModel(
    modelId as ChromeAIChatModelId,
    settings as ChromeAIChatSettings,
  );
}
