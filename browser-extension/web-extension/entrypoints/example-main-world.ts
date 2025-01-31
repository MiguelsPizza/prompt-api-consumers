import { createTRPCProxyClient } from '@trpc/client';

import type { AppRouter } from '@/background/routers';
import { windowLink } from '@/chromeTrpcAdditions/trpc-browser/link';
import { createWebAIPolyfill } from "@local-first-web-ai-monorepo/web-ai-polyfill";

// const session

export default defineUnlistedScript(() => {
  console.log('Testing tRPC subscriptions and mutations');

  const trpc = createTRPCProxyClient<AppRouter>({ links: [windowLink({ window: window })] });

  const polyfill = createWebAIPolyfill({
    partialPolyfill: {
      languageModel: {
        create: async (options) => {
          const { success } = await trpc.mlc.reload.mutate({
            modelId: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
            chatOpts: options
          })
          if (!success) throw new Error('Failed to create Session')

          return {
            prompt: async (input, options) => {
              const res = trpc.mlc.chat.query({})
            }
          } as AILanguageModel
        },
        capabilities: async () => ({
          available: 'readily',
          defaultTemperature: 0.7,
          defaultTopK: 10,
          maxTopK: 10,
          languageAvailable: (language) => 'no',
        } as AILanguageModelCapabilities)
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

  // Set up subscription first
  // const subscription = client.onPostAdd.subscribe(
  //   { id: 'test-subscription' },
  //   {
  //     onData: (post) => {
  //       console.log('Received post:', post);
  //       // Verify the post structure
  //       console.assert(typeof post.text === 'string', 'Post text should be a string');
  //       console.assert(
  //         typeof post.id === 'string' || post.id === undefined,
  //         'Post ID should be a string or undefined',
  //       );
  //     },
  //     onError: (err) => {
  //       console.error('Subscription error:', err);
  //     },
  //     onComplete: () => {
  //       console.log('Subscription completed');
  //     },
  //   },
  // );

  // Add test functions to window for manual testing
  // window.testTRPC = {
  //   test: () => client.mlc.chat.query({
  //     messages: [
  //       { content: 'hello', role: 'user' }
  //     ]
  //   }),
  //   reload: () => client.mlc.reload.mutate({ modelId: "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC" }),
  //   // client,
  //   // Test adding a single post
  //   addPost: async () => {
  //     try {
  //       const result = await client.add.mutate({
  //         text: 'Test post',
  //         id: crypto.randomUUID(),
  //       });
  //       console.log('Added post:', result);
  //       return result;
  //     } catch (err) {
  //       console.error('Error adding post:', err);
  //       throw err;
  //     }
  //   },

  //   // Test adding multiple posts in sequence
  //   addMultiplePosts: async (count = 3) => {
  //     const results = [];
  //     for (let i = 0; i < count; i++) {
  //       try {
  //         const result = await client.add.mutate({
  //           text: `Test post ${i + 1}`,
  //           id: crypto.randomUUID(),
  //         });
  //         results.push(result);
  //         console.log(`Added post ${i + 1}:`, result);
  //       } catch (err) {
  //         console.error(`Error adding post ${i + 1}:`, err);
  //       }
  //     }
  //     return results;
  //   },

  //   // Unsubscribe from the subscription
  //   unsubscribe: () => {
  //     subscription.unsubscribe()
  //     console.log('Unsubscribed from posts');
  //   },
  // };

  console.log('Test functions added to window.testTRPC');
  console.log('You can now use:');
  console.log('- window.testTRPC.addPost()');
  console.log('- window.testTRPC.addMultiplePosts(count)');
  console.log('- window.testTRPC.unsubscribe()');
});
