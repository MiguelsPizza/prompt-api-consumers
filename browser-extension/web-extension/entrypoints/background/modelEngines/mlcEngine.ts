import { CreateChromeContextOptions } from "@/chromeTrpcAdditions/trpc-browser/adapter";
import { InitProgressReport, MLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";

export const createEngine = (opts: CreateChromeContextOptions) => {
  try {
    console.log('[Background/createEngine] Creating new MLCEngine instance...');
    const engine = new MLCEngine({
      appConfig: prebuiltAppConfig,
      logLevel: 'DEBUG',
      initProgressCallback: (progress) => {
        console.log('[Background/createEngine] Init progress:', progress);
        // TODO: probably not the best way to do this
        storage.setItem<InitProgressReport>('session:progress', progress)
      }
    });
    console.log('[Background/createEngine] MLCEngine instance created successfully');
    return engine;
  } catch (error) {
    const err = error as Error;
    console.error('[Background] Failed to create engine:', err);
    throw new Error(`Engine creation failed: ${err.message}`);
  }
};