import { z } from "zod"

export const RootSchema = z.object({
  sidebar: z.string().nullish().transform(val => val ?? 'open').refine(val => val === 'open' || val === 'collapsed', {
    message: "Sidebar must be either 'open' or 'collapsed'"
  })
})

export const ChatInterfaceSearchSchema = RootSchema.extend({
  conversationOptions: z.string().refine(val => val === 'open' || val === 'collapsed', {
    message: "Conversation options must be either 'open' or 'collapsed'"
  })
})

export const AuthSearchSchema = ChatInterfaceSearchSchema.extend({
  authType: z.string().refine(val => val === 'signup' || val === 'login', {
    message: "Auth type must be either 'signup' or 'login'"
  })
})

export type RootSearch = z.infer<typeof RootSchema>
export type ChatInterfaceSearch = z.infer<typeof ChatInterfaceSearchSchema>
export type AuthSearch = z.infer<typeof AuthSearchSchema>