/* eslint-disable @typescript-eslint/no-floating-promises */
// mlcRouter.ts
// import { getEngine } from '../modelEngines/mlcEngine';
import { ChatCompletionMessageParam, ChatOptions } from '@mlc-ai/web-llm';
import { z } from 'zod';
// import { engine } from '..';
import { observable } from '@trpc/server/observable';
// import { getEngine } from '../modelEngines/mlcEngine';
import { SupportedLLMModel } from '../lib/supportedModels';
import { t } from './trpcBase';

export const mlcRouter = t.router({
  // 1) Reload procedure
  reload: t.procedure
    .input(
      z.object({
        modelId: SupportedLLMModel,
        chatOpts: z.any().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      console.log('[MLC Router] Reloading model:', input.modelId);
      if (input.chatOpts) {
        console.log('[MLC Router] With chat options:', input.chatOpts);
      }
      // const e = ctx.engine
      await ctx.chatEngine.reload(input.modelId, input.chatOpts as ChatOptions);
      console.log('[MLC Router] Model reload complete');
      return { success: true };
    }),

  // 2) Non-streaming chat completion(simple query)
  chat: t.procedure
    .input(
      z.object({
        modelId: SupportedLLMModel,
        messages: z.array(
          z.object({
            role: z.enum(['system', 'user', 'assistant']),
            content: z.string(),
          }),
        ),
        // optional flags, e.g. temperature, etc
      }),
    )
    .query(async ({ input, ctx }) => {
      // const engine = await getEngine();
      await ctx.chatEngine.reload(input.modelId)
      // Call the normal single-pass `chat.completions.create`
      const result = await ctx.chatEngine.chat.completions.create({
        stream: false,
        messages: input.messages as ChatCompletionMessageParam[],
      });

      // This returns a ChatCompletion type from web-llm
      // Typically { choices: [ { message: { role, content } } ] }
      return result;
    }),

  // 3) Streaming chat completion(use a subscription)
  chatStream: t.procedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(['system', 'user', 'assistant']),
            content: z.string(),
          }),
        ),
      }),
    )
    .subscription(({ input, ctx }) => {
      return observable<string>((emit) => {
        let isDone = false;

        (async () => {
          try {

            // "stream" is set to true, so we can iterate
            const completion = await ctx.chatEngine.chat.completions.create({
              stream: true,
              messages: input.messages as ChatCompletionMessageParam[],
            });

            let buffer = '';
            for await (const chunk of completion) {
              const piece = chunk.choices[0].delta.content ?? '';
              buffer += piece;
              // Emit partial chunk or the entire buffer
              emit.next(buffer);
            }
            isDone = true;
            emit.complete();
          } catch (err) {
            emit.error(err);
          }
        })();

        // Unsubscribe logic
        return async () => {
          if (!isDone && ctx.chatEngine) {
            // If you need to forcibly cancel the MLC stream, do so
            // e.g. engine.chat.stop()? (If such a method exists)
          }
        };
      });
    }),
});
