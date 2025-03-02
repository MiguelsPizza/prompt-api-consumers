import { useDrizzleLiveIncremental, useDrizzlePGlite } from '@/dataLayer';
import { useToast } from '@/hooks/use-toast';
import {
  AppendMessage,
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from '@assistant-ui/react';
import { MyThread } from '@local-first-web-ai-monorepo/react-ui/components/thread';
import { ToastAction } from '@local-first-web-ai-monorepo/react-ui/components/toast';
import {
  conversation_messages,
  ConversationMessage,
  ConversationWithRelations,
} from '@local-first-web-ai-monorepo/schema/cloud';
import { useStatelessPromptAPI } from '@local-first-web-ai-monorepo/use-prompt-api';
import { getRouteApi } from '@tanstack/react-router';
import { and, count, eq, gt, gte } from 'drizzle-orm';
import 'highlight.js/styles/github-dark.css';
import { useMemo } from 'react';

export const ChatMessages = () => {
  const { toast } = useToast();
  const db = useDrizzlePGlite();
  const { useParams } = getRouteApi('/conversation/$id');
  const { id: currentConversationId } = useParams();
  const { useLoaderData } = getRouteApi('/conversation/$id');
  const currentConversation: ConversationWithRelations = useLoaderData();

  let { data: messages }: { data: ConversationMessage[] } =
    useDrizzleLiveIncremental('id', (db) => {
      return db
        .select()
        .from(conversation_messages)
        .where(eq(conversation_messages.conversation_id, currentConversationId))
        .orderBy(conversation_messages.position);
    });
  messages ??=
    currentConversation.conversation_messages as ConversationMessage[];
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
      let buffer = ''
      const res = await sendPrompt(input, {
        streaming: true,
        onToken: async (chunk: string) => {
          if (assistantMessageId) {
            buffer += chunk
            await db
              .update(conversation_messages)
              .set({ content: buffer })
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
      console.log('Starting handleEdit with message:', message);
      if (!message.parentId) throw new Error('No parent Id');
      const input =
        message.content[0].type === 'text' ? message.content[0].text : '';
      console.log('Extracted input text:', input);

      // Find the message to edit by matching the content instead of parentId
      const messageToEdit = await db.query.conversation_messages.findFirst({
        where: ({ id }, { eq }) => eq(id, message.parentId!),
      });
      console.log('Found message to edit:', messageToEdit);
      if (!messageToEdit) {
        throw new Error('Message to edit not found');
      }

      const now = new Date().toISOString();
      console.log('Starting transaction at:', now);

      await db.transaction(async (tx) => {
        console.log(
          'Deleting messages after position:',
          messageToEdit.position,
        );
        // Delete all messages after the edited message
        await tx
          .delete(conversation_messages)
          .where(
            and(
              eq(conversation_messages.conversation_id, currentConversation.id),
              gt(conversation_messages.position, messageToEdit.position ?? 0),
            ),
          );

        // Update the existing message
        await tx
          .update(conversation_messages)
          .set({
            content: input,
            temperature_at_creation: currentConversation.temperature ?? 0.7,
            top_k_at_creation: currentConversation.top_k ?? 10,
          })
          .where(eq(conversation_messages.id, messageToEdit.id));

        // Add empty assistant message that will be streamed into
        const assistantMessageId = crypto.randomUUID();
        console.log(
          'Adding empty assistant message with ID:',
          assistantMessageId,
        );
        await tx.insert(conversation_messages).values({
          id: assistantMessageId,
          conversation_id: currentConversation.id,
          position: messageToEdit.position ? messageToEdit.position + 1 : 1,
          role: 'assistant',
          content: '',
          temperature_at_creation: currentConversation.temperature ?? 0.7,
          top_k_at_creation: currentConversation.top_k ?? 10,
          user_id: messageToEdit.user_id,
        });

        console.log('Starting streaming response');
        let buffer = ''
        // Stream the new response
        const res = await sendPrompt(input, {
          streaming: true,
          onToken: async (chunk: string) => {
            buffer += chunk
            await tx
              .update(conversation_messages)
              .set({
                content: buffer,
                updated_at: new Date().toISOString(),
              })
              .where(eq(conversation_messages.id, assistantMessageId));
          },
        });

        if (!res) throw new Error('Model failed to respond');
        console.log('Streaming completed successfully');
      });
      console.log('Transaction completed successfully');
    } catch (error) {
      console.error('Error in handleEdit:', error);
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
  const runtime = useExternalStoreRuntime<ConversationMessage>({
    isRunning: loading || isResponding || isThinking,
    messages: messages,
    onNew: async (message) => {
      if (message.content[0]?.type !== 'text') {
        throw new Error('Only text messages are supported');
      }
      await handleSubmit(message.content[0].text);
    },
    onEdit: async (message) => {
      console.log({ message });
      if (message.content[0]?.type !== 'text') {
        throw new Error('Only text messages are supported');
      }
      await handleEdit(message);
    },
    onCancel: handleCancel,
    onReload: handleReload,
    convertMessage: (message) => ({
      metadata: {
        custom: {
          id: message.id,
        },
      },
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
