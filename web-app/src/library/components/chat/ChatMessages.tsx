import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, ArrowDown, Square, AlertCircle } from 'lucide-react';
import { ConversationMessageType, db } from '@/powersync/AppSchema';
import { AssistantRuntimeProvider, Thread, useExternalStoreRuntime } from '@assistant-ui/react';
import { ThinkingCard } from './ThinkingCard';
import { useStatelessPromptAPI } from 'use-prompt-api';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useQuery } from '@powersync/react';
import { useSupabase } from '@/utils/Contexts';
import { getSyncEnabled } from '@/powersync/SyncMode';
import { useConversation } from '@/utils/Contexts';
import { getRouteApi } from '@tanstack/react-router';
import 'highlight.js/styles/github-dark.css';
import { ThreadPrimitive, MessagePrimitive, ComposerPrimitive } from "@assistant-ui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";
import { MarkdownText } from '../ui/markdown-text';
import { MyThread } from '../ui/thread';
import { ScrollArea } from '../ui/scroll-area';

type ThreadMessageLike = {
  role: string;
  content: { type: "text"; text: string }[];
};


export const ChatMessages = () => {
  const supabase = useSupabase()
  const { toast } = useToast();

  const { useParams } = getRouteApi('/conversation/$id')
  const { id: currentConversationId } = useParams()

  const { data: messages } = useQuery(db.selectFrom('conversation_messages').where('conversation_id', '=', currentConversationId).selectAll())
  const { data: [currentConversation] = [] } = useQuery(db.selectFrom('conversations').where('id', '=', currentConversationId).selectAll())
  //don't pass in the user prompt if it makes it into the arr before the request is sent
  //this is not a great solution
  const initialPrompts = useMemo(
    () => (messages.at(-1)?.role === 'user' ? messages.slice(-1) : messages),
    [messages],
  ) as (AILanguageModelAssistantPrompt | AILanguageModelUserPrompt)[];

  const { loading, sendPrompt, error, abort, isResponding, isThinking, session, abortController } =
    useStatelessPromptAPI(currentConversationId as string, {
      systemPrompt: currentConversation?.system_prompt ?? undefined,
      temperature: currentConversation?.temperature ?? 0.7,
      topK: currentConversation?.top_k ?? 10,
      initialPrompts: initialPrompts,
    });

  // TODO: The counting seems to be Debounced in the session internals, Find a way to debounce sending the request
  // useEffect(() => {
  //   if (!session) return;
  //   session.countPromptTokens(input, { signal: abortController?.signal })
  //     .then(tokens => {
  //       setInputTokens(tokens)
  //     })
  //     .catch(console.error);
  // }, [input, Boolean(session), abortController]);

  // Add state for tracking the streaming message ID

  const addMessageToConversation = async (message: Partial<ConversationMessageType>) => {
    if (!currentConversation?.id) return;

    try {
      const now = new Date();
      const user = await supabase?.client.auth.getUser()
      const { count } = await db.selectFrom('conversation_messages')
        .select(({ fn }) => [fn.count<number>('id').as('count')])
        .where('conversation_id', '=', currentConversation.id)
        .executeTakeFirstOrThrow();
      const position = count;

      const res = await db.insertInto('conversation_messages')
        .values({
          id: crypto.randomUUID(),
          conversation_id: currentConversation.id,
          position,
          role: message.role,
          content: message.content,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          temperature_at_creation: currentConversation?.temperature ?? 0.7,
          top_k_at_creation: currentConversation?.top_k ?? 10,
          user_id: getSyncEnabled() && user?.data?.user ? user.data.user?.id : "Local_ID"

        })
        .returning('id')
        .executeTakeFirstOrThrow()

      await db.updateTable('conversations')
        .set({ updated_at: now.toISOString() })
        .where('id', '=', currentConversation.id)
        .executeTakeFirstOrThrow();
      return res!.id!
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
    if (!currentConversation?.id) {
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
      tempUserMessageId = await addMessageToConversation({ role: 'user', content: input });

      assistantMessageId = await addMessageToConversation({
        role: 'assistant',
        content: ''
      });


      // Start streaming, updating the message content as chunks arrive
      const res = await sendPrompt(input, {
        streaming: true,
        onToken: async (chunk) => {
          if (assistantMessageId) {
            await db.updateTable('conversation_messages')
              .set({ content: chunk })
              .where('id', '=', assistantMessageId)
              .execute();
          }
        }
      });

      if (!res) throw new Error('Model Failed to respond');

    } catch (error) {
      console.error({ error });
      if (tempUserMessageId) {
        await db.deleteFrom('conversation_messages')
          .where('id', '=', tempUserMessageId)
          .execute();
      }
      if (assistantMessageId) {
        await db.deleteFrom('conversation_messages')
          .where('id', '=', assistantMessageId)
          .execute();
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

  const handleEdit = async (input: string) => {
    if (!currentConversation?.id) return;

    try {
      // Get the last user and assistant messages
      const lastAssistantMessage = messages
        .filter(m => m.role === 'assistant')
        .pop();

      const lastUserMessage = messages
        .filter(m => m.role === 'user')
        .pop();

      if (!lastAssistantMessage || !lastUserMessage) {
        throw new Error('No messages to edit');
      }

      // Update both the user and assistant messages
      await db.transaction().execute(async (trx) => {
        // Update user message with new content
        await trx.updateTable('conversation_messages')
          .set({ content: input })
          .where('id', '=', lastUserMessage.id)
          .execute();

        // Clear assistant message content initially
        await trx.updateTable('conversation_messages')
          .set({ content: '' })
          .where('id', '=', lastAssistantMessage.id)
          .execute();
      });



      // Stream the new response
      const res = await sendPrompt(input, {
        streaming: true,
        onToken: async (chunk) => {
          await db.updateTable('conversation_messages')
            .set({ content: chunk })
            .where('id', '=', lastAssistantMessage.id)
            .execute();
        }
      });

      if (!res) throw new Error('Model failed to respond');

    } catch (error) {

      toast({
        variant: 'destructive',
        title: 'Edit Error',
        description: error instanceof Error ? error.message : 'Failed to edit message',
      });
    }
  };

  const handleCancel = async () => {
    abort();

  };

  const handleReload = async (parentId: string | null) => {
    if (!currentConversation?.id) return;

    try {
      // Get the last user message before the current assistant message
      const userMessage = messages
        .filter(m => m.role === 'user')
        .pop();

      if (!userMessage) {
        throw new Error('No user message to reload from');
      }

      // Retry the last interaction
      await handleSubmit(userMessage.content ?? '');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Reload Error',
        description: error instanceof Error ? error.message : 'Failed to reload message',
      });
    }
  };

  // Update the runtime creation with new handlers
  const runtime = useExternalStoreRuntime({
    isRunning: loading || isResponding || isThinking,
    messages: messages,
    onNew: async (message) => {
      if (message.content[0]?.type !== "text") {
        throw new Error("Only text messages are supported");
      }
      await handleSubmit(message.content[0].text);
    },
    onEdit: async (message) => {
      if (message.content[0]?.type !== "text") {
        throw new Error("Only text messages are supported");
      }
      await handleEdit(message.content[0].text);
    },
    onCancel: handleCancel,
    onReload: handleReload,
    convertMessage: (message) => ({
      role: (message.role === 'user' || message.role === 'assistant' || message.role === 'system'
        ? message.role
        : 'user') as 'user' | 'assistant' | 'system',
      content: [{ type: "text", text: message.content ?? '' }]
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
