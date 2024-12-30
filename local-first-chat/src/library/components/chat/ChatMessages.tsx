import { useMemo } from 'react';
import { useDrizzlePGlite } from '@/dataLayer';
import { conversation_messages } from '@/dataLayer/schema';
import {
  AppendMessage,
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from '@assistant-ui/react';
import { useStatelessPromptAPI } from 'use-prompt-api';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { getRouteApi } from '@tanstack/react-router';
import 'highlight.js/styles/github-dark.css';
import { MyThread } from '../ui/thread';
import { useDrizzleTanstackLiveIncremental } from '@/dataLayer/src/react-tanstack';
import { and, count, eq, gte } from 'drizzle-orm';

export const ChatMessages = () => {
  const { toast } = useToast();
  const db = useDrizzlePGlite();
  const { useParams } = getRouteApi('/conversation/$id');
  const { id: currentConversationId } = useParams();
  const { useLoaderData } = getRouteApi('/conversation/$id');
  const currentConversation = useLoaderData();

  let { data: messages } = useDrizzleTanstackLiveIncremental({
    drizzleQuery: db
      .select()
      .from(conversation_messages)
      .where(eq(conversation_messages.conversation_id, currentConversationId))
      .orderBy(conversation_messages.position),
    diffKey: 'id',
    queryKey: ['conversation', currentConversationId, 'messages'],
  });
  messages ??= currentConversation.conversation_messages;
  //don't pass in the user prompt if it makes it into the arr before the request is sent
  //this is not a great solution
  const initialPrompts = useMemo(
    () => (messages.at(-1)?.role === 'user' ? messages.slice(-1) : messages),
    [messages],
  );

  const { loading, sendPrompt, abort, isResponding, isThinking } =
    useStatelessPromptAPI(currentConversationId, {
      systemPrompt: currentConversation.system_prompt ?? undefined,
      temperature: currentConversation.temperature ?? 0.7,
      topK: currentConversation.top_k ?? 10,
      //needed for type for some reason
      initialPrompts: initialPrompts.map((a) => ({
        role: a.role as 'user',
        content: a.content,
      })),
    });

  const addMessageToConversation = async (
    message: Partial<typeof conversation_messages.$inferSelect>,
  ) => {
    if (!currentConversation.id) return;

    try {
      const now = new Date();
      const result = await db
        .select({ count: count() })
        .from(conversation_messages)
        .where(
          eq(conversation_messages.conversation_id, currentConversation.id),
        );

      const position = Number(result[0].count);

      const res = await db
        .insert(conversation_messages)
        .values({
          id: crypto.randomUUID(),
          conversation_id: currentConversation.id,
          position,
          role: message.role!,
          content: message.content!,
          created_at: new Date().toISOString(),
          temperature_at_creation: currentConversation.temperature ?? 0.7,
          top_k_at_creation: currentConversation.top_k ?? 10,
          user_id: 'Local_ID',
        })
        .returning({ id: conversation_messages.id });

      return res[0].id;
    } catch (error) {
      console.error('Error adding message to conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to add message to chat',
      });
    }
  };

  const handleSubmit = async (input: string) => {
    if (!currentConversation.id) {
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description: 'No conversation started',
      });
      return;
    }
    let tempUserMessageId: string | undefined;
    let assistantMessageId: string | undefined;

    try {
      tempUserMessageId = await addMessageToConversation({
        role: 'user',
        content: input,
      });

      assistantMessageId = await addMessageToConversation({
        role: 'assistant',
        content: '',
      });

      // Start streaming, updating the message content as chunks arrive
      const res = await sendPrompt(input, {
        streaming: true,
        onToken: async (chunk: string) => {
          if (assistantMessageId) {
            await db
              .update(conversation_messages)
              .set({ content: chunk })
              .where(eq(conversation_messages.id, assistantMessageId));
          }
        },
      });

      if (!res) throw new Error('Model Failed to respond');
    } catch (error) {
      console.error({ error });
      if (tempUserMessageId) {
        await db
          .delete(conversation_messages)
          .where(eq(conversation_messages.id, tempUserMessageId));
      }
      if (assistantMessageId) {
        await db
          .delete(conversation_messages)
          .where(eq(conversation_messages.id, assistantMessageId));
      }

      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description:
          error instanceof Error ? error.message : 'Failed to send message',
        action: (
          <ToastAction altText="Try again" onClick={() => handleSubmit(input)}>
            Try again
          </ToastAction>
        ),
      });
    }
  };

  const handleEdit = async (message: AppendMessage) => {
    if (!currentConversation.id) return;
    try {
      const input =
        message.content[0].type === 'text' ? message.content[0].text : '';

      // Find the message to edit by matching the content instead of parentId
      const messageToEdit = messages.find(
        (m) => m.role === 'user' && m.content === input,
      );
      if (!messageToEdit) {
        throw new Error('Message to edit not found');
      }

      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        // Delete all messages after the edited message
        await tx
          .delete(conversation_messages)
          .where(
            and(
              eq(conversation_messages.conversation_id, currentConversation.id),
              gte(conversation_messages.position, messageToEdit.position ?? 0),
            ),
          );

        // Add the edited user message
        await tx.insert(conversation_messages).values({
          id: crypto.randomUUID(),
          conversation_id: currentConversation.id,
          position: messageToEdit.position,
          role: 'user',
          content: input,
          created_at: now,
          temperature_at_creation: currentConversation.temperature ?? 0.7,
          top_k_at_creation: currentConversation.top_k ?? 10,
          user_id: messageToEdit.user_id,
        });

        // Add empty assistant message that will be streamed into
        const assistantMessageId = crypto.randomUUID();
        await tx.insert(conversation_messages).values({
          id: assistantMessageId,
          conversation_id: currentConversation.id,
          position: messageToEdit.position ? messageToEdit.position + 1 : 0,
          role: 'assistant',
          content: '',
          created_at: now,
          temperature_at_creation: currentConversation.temperature ?? 0.7,
          top_k_at_creation: currentConversation.top_k ?? 10,
          user_id: messageToEdit.user_id,
        });

        // Stream the new response
        const res = await sendPrompt(input, {
          streaming: true,
          onToken: async (chunk: string) => {
            await tx
              .update(conversation_messages)
              .set({
                content: chunk,
                updated_at: new Date().toISOString(),
              })
              .where(eq(conversation_messages.id, assistantMessageId));
          },
        });

        if (!res) throw new Error('Model failed to respond');
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Edit Error',
        description:
          error instanceof Error ? error.message : 'Failed to edit message',
      });
    }
  };

  const handleCancel = async () => {
    abort();
  };

  const handleReload = async (parentId: string | null) => {
    if (!currentConversation.id) return;

    try {
      // Get the last user message before the current assistant message
      const userMessage = messages.find((m) => m.id === parentId);

      if (!userMessage) {
        throw new Error('No user message to reload from');
      }
      //delete all messages after the user message
      await db
        .delete(conversation_messages)
        .where(
          and(
            eq(conversation_messages.conversation_id, currentConversation.id),
            gte(conversation_messages.position, userMessage.position ?? 0),
          ),
        );

      // Retry the last interaction
      await handleSubmit(userMessage.content ?? '');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Reload Error',
        description:
          error instanceof Error ? error.message : 'Failed to reload message',
      });
    }
  };

  // Update the runtime creation with new handlers
  const runtime = useExternalStoreRuntime({
    isRunning: loading || isResponding || isThinking,
    messages: messages,
    onNew: async (message) => {
      if (message.content[0]?.type !== 'text') {
        throw new Error('Only text messages are supported');
      }
      await handleSubmit(message.content[0].text);
    },
    onEdit: async (message) => {
      if (message.content[0]?.type !== 'text') {
        throw new Error('Only text messages are supported');
      }
      await handleEdit(message);
    },
    onCancel: handleCancel,
    onReload: handleReload,
    convertMessage: (message) => ({
      role:
        message.role === 'user' ||
        message.role === 'assistant' ||
        message.role === 'system'
          ? message.role
          : 'user',
      content: [{ type: 'text', text: message.content ?? '' }],
      id: message.id,
      created_at: message.created_at ? new Date(message.created_at) : undefined,
    }),
  });

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
      <AssistantRuntimeProvider runtime={runtime}>
        <MyThread />
      </AssistantRuntimeProvider>
    </div>
  );
};
