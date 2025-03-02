import { z } from 'zod';
import { fallback, zodValidator } from '@tanstack/zod-adapter';

const RootSearchSchema = z.object({
  sidebar: fallback(z.enum(['open', 'collapsed']), 'open').default('open'),
});

const ChatInterfaceSearchSchema = RootSearchSchema.extend({
  conversationOptions: fallback(
    z.enum(['open', 'collapsed']),
    'collapsed',
  ).default('collapsed'),
});

const AuthSearchSchema = ChatInterfaceSearchSchema.extend({
  authType: fallback(z.enum(['signup', 'login']), 'login').default('login'),
});

export const RootSchema = zodValidator(RootSearchSchema);
export const ChatInterfaceSchema = zodValidator(ChatInterfaceSearchSchema);
export const AuthSchema = zodValidator(AuthSearchSchema);

export type RootSearch = z.infer<typeof RootSearchSchema>;
export type ChatInterfaceSearch = z.infer<typeof ChatInterfaceSearchSchema>;
export type AuthSearch = z.infer<typeof AuthSearchSchema>;
