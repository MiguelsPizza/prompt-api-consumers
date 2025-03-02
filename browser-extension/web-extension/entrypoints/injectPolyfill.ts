import { createTRPCProxyClient } from '@trpc/client';

import { windowLink } from '@/chromeTrpcAdditions/trpc-browser/link';
import type { AppRouter } from '@/entrypoints/background/routers/index';
import { attachAIObjectToWindow, createWebAIPolyfill } from "@local-first-web-ai-monorepo/web-ai-polyfill";
import type { Unsubscribable } from '@trpc/server/observable';
import type { SupportedLLMModel } from './background/lib/supportedModels';

// const session

export default defineUnlistedScript(() => {
  console.log('Testing tRPC subscriptions and mutations');

  //TODO: get this from the extension
  const modelMap = new Map<SupportedLLMModel, AICapabilityAvailability>();

  const trpc = createTRPCProxyClient<AppRouter>({ links: [windowLink({ window: window })] });
  trpc.sessions.all.query().then(console.log).catch(console.error)
  const polyfill = createWebAIPolyfill({
    partialPolyfill: {
      languageModel: {
        create: async (options, model: SupportedLLMModel = 'Llama-3.2-1B-Instruct-q4f16_1-MLC') => {
          const { newSession, newSessionMessages } = await trpc.languageModel.create.mutate({
            modelId: model,
            chatOpts: options,
            requesterURL: window.location.href,
            sessionId: window.crypto.randomUUID()
          })
          if (!newSession) throw new Error('Failed to create Session')

          let monitorSubscription: Unsubscribable | undefined = undefined;
          if (options?.monitor) {
            const eventTargetForMonitor = new EventTarget() as EventTarget & {
              ondownloadprogress?: (event: ProgressEvent) => void;
            };
            Object.defineProperty(eventTargetForMonitor, 'ondownloadprogress', {
              set(handler) {
                eventTargetForMonitor.addEventListener('downloadprogress', handler);
              }
            });
            options.monitor(eventTargetForMonitor as AICreateMonitor);

            monitorSubscription = trpc.languageModel.downloadProgress.subscribe(undefined, {
              onData(progressEvent) {
                if (progressEvent && typeof progressEvent.progress === 'number') {
                  const e = new ProgressEvent('downloadprogress', {
                    loaded: progressEvent.progress,
                    total: 1
                  });
                  eventTargetForMonitor.dispatchEvent(e);
                }
              },
            });
          }
          return {
            async prompt(input, promptOptions) {
              let messages: {
                role: "user" | "assistant";
                content: string;
              }[] = []
              if (typeof input === 'string') {
                messages = [{ role: 'user', content: input }]
              } else if (Array.isArray(input)) {
                messages = input
              } else {
                messages = [input]
              }
              const { error, result } = await trpc.languageModel.prompt.mutate({
                sessionId: newSession,
                messages,
              }, { signal: promptOptions?.signal })

              if (error) throw new Error(error)

              return result!.choices[0].message.content!
            },

            promptStreaming(input, _promptOptions) {
              let messages: {
                role: "user" | "assistant";
                content: string;
              }[] = [];

              if (typeof input === 'string') {
                messages = [{ role: 'user', content: input }];
              } else if (Array.isArray(input)) {
                messages = input;
              } else {
                messages = [input];
              }

              let subscription: Unsubscribable
              return new ReadableStream({
                start(controller) {
                  subscription = trpc.languageModel.promptStreaming.subscribe(
                    {
                      sessionId: newSession,
                      messages,
                    },
                    {
                      onData: (data) => {
                        controller.enqueue(data);
                      },
                      onError: (err) => {
                        controller.error(err);
                      },
                      onComplete: () => {
                        controller.close();
                      },
                      signal: _promptOptions?.signal
                    });
                },
                cancel(reason) {
                  subscription.unsubscribe()
                  console.log('Stream canceled:', reason);
                },
              });
            },

            destroy() {
              if (monitorSubscription) {
                monitorSubscription.unsubscribe();
              }
              try {
                trpc.languageModel.destroy.mutate({ sessionId: newSession })
                console.warn('Session destroyed:', newSession)
              } catch (error) {
                console.error('Failed to destroy language model session:', error)
              }
            },

            async countPromptTokens(_input, _opts) {
              return 1;
            },

            addEventListener,

            async clone(_cloneOptions) {
              return this;
            },
            removeEventListener,
            dispatchEvent: {} as any,
            oncontextoverflow: {} as any,
            tokensSoFar: 0,
            maxTokens: 10000,
            tokensLeft: 10000,
            topK: options?.topK ?? 10,
            temperature: options?.temperature ?? 0.7,
            get expectedInputLanguages() {
              return 'en'
            },
          }
        },
        capabilities: async (model: SupportedLLMModel = 'chromeAI') => ({
          available: model === 'chromeAI' ? (await window.ai.languageModel.capabilities()).available : (modelMap.get(model) ?? 'after-download'),
          defaultTemperature: 0.7,
          defaultTopK: 10,
          maxTopK: 10,
          languageAvailable: (language) => 'no',
        })
      }
    },
    info: {
      description: 'The OG chrome AI polyfill extension',
      icon: 'data:image/svg+xml;base64,REPLACEME',
      name: 'POLY FILL',
      "uuid": "0000-0000-0000-0000-0000"
    },
    options: {
      onProviderSelect: () => console.warn("[WebAI Polyfill] Provider selected - initialization logic needs to be implemented"),
      onProviderDeselect: () => console.warn("[WebAI Polyfill] Provider deselected - cleanup logic needs to be implemented"),
    }
  })
  console.log(polyfill)
  attachAIObjectToWindow(polyfill)
  console.log('Window.ai Attached')
});
