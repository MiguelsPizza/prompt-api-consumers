import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { t } from "./trpcBase";

interface Post {
  text: string;
  id?: string | undefined;
}


export const testRouter = t.router({
  openNewTab: t.procedure.input(z.object({ url: z.string().url() })).mutation(async ({ input }) => {
    console.log('[Background/openNewTab] Opening new tab with URL:', input.url);
    await chrome.tabs.create({ url: input.url, active: true });
    console.log('[Background/openNewTab] Tab created successfully');
  }),
  onPostAdd: t.procedure.input(z.object({ id: z.string() })).subscription((opts) => {
    console.log('[Background/onPostAdd] Setting up subscription for ID:', opts.input.id);
    return observable<Post>((subscriber) => {
      const handler = (post: Post) => {
        console.log('[Background/onPostAdd] Received new post, sending to subscriber:', post);
        subscriber.next(post);
      };

      console.log('[Background/onPostAdd] Adding event listener...');
      opts.ctx.eventEmitter.on('add', handler);

      return () => {
        console.log('[Background/onPostAdd] Cleaning up subscription, removing event listener');
        opts.ctx.eventEmitter.off('add', handler);
      };
    });
  }),
  add: t.procedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        text: z.string().min(1),
      }),
    )
    .mutation((opts) => {
      console.log('[Background/add] Adding new post:', opts.input);
      const post = { ...opts.input }; /* [..] add to db */
      console.log('[Background/add] Emitting add event with post:', post);
      opts.ctx.eventEmitter.emit('add', post);
      console.log('[Background/add] Post added successfully');
      return post;
    }),
})