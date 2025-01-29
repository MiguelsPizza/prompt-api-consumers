import { createTRPCProxyClient } from '@trpc/client';

import type { AppRouter } from '@/background/routers';
import console from 'console';
import { windowLink } from '../../../src/link/windowLink';

export default defineUnlistedScript(() => {
  console.log('Testing tRPC subscriptions and mutations');

  const client = createTRPCProxyClient<AppRouter>({ links: [windowLink()] });

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
