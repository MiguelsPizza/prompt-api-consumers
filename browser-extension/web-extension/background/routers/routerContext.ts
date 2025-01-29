import { ExtensionServiceWorkerMLCEngine, ExtensionServiceWorkerMLCEngineHandler, MLCEngine, modelLibURLPrefix, modelVersion } from '@mlc-ai/web-llm';
import EventEmitter from "events";
import { CreateChromeContextOptions } from "../../../../src/adapter";

export const createEngine = (opts: CreateChromeContextOptions) => {
  try {
    console.log('[Background/createEngine] Creating new MLCEngine instance...');
    const engine = new MLCEngine({
      appConfig: {
        useIndexedDBCache: true,
        model_list: [{
          model: "https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f16_1-MLC",
          model_id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
          model_lib:
            modelLibURLPrefix +
            modelVersion +
            "/SmolLM2-360M-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
          vram_required_MB: 376.06,
          low_resource_required: true,
          required_features: ["shader-f16"],
          overrides: {
            context_window_size: 4096,
          },
        }]
      },
      logLevel: 'DEBUG',
      initProgressCallback: (progress) => {
        console.log('[Background/createEngine] Init progress:', progress);
        opts.req.postMessage(progress)
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

export const createHandler = (port: chrome.runtime.Port, engine: ExtensionServiceWorkerMLCEngine) => {
  console.log('[Background] Initializing new ExtensionServiceWorkerMLCEngineHandler...');
  try {
    const handler = new ExtensionServiceWorkerMLCEngineHandler(port);

    chrome.runtime.onConnect.addListener(function (port) {
      console.log({ port })
      console.assert(port.name === "web_llm_service_worker");
      handler.setPort(port);
      port.onMessage.addListener(handler.onmessage.bind(handler));
    });

    console.log('[Background] Handler successfully initialized');
    return handler;
  } catch (error) {
    const err = error as Error;
    console.error('[Background] Failed to initialize handler:', err);
    throw new Error(`Handler initialization failed: ${err.message}`);
  }
};

export const createContext = async (opts: CreateChromeContextOptions) => {
  const eventEmitter = new EventEmitter();

  const engine = createEngine(opts);

  console.log('[Background] Context creation completed successfully');
  return {
    chatEngine: engine,
    eventEmitter
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;