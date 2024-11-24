import { useState, useRef, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, ArrowDown, Square, AlertCircle } from 'lucide-react';
import { db } from '@/powersync/AppSchema';
import { MessageCard } from './MessageCard';
import { ThinkingCard } from './ThinkingCard';
import { useStatelessPromptAPI } from 'use-prompt-api';
import { ChatMessagesProps, Message } from '../../types/chat';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

export const ChatMessages = ({ currentConversation }: ChatMessagesProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [inputTokens, setInputTokens] = useState(0);
  const [input, setInput] = useState('');
  const { toast } = useToast();

  const messages =
    useLiveQuery(async () => {
      if (currentConversation?.id) {
        return await db.conversationMessage
          .where('conversation')
          .equals(currentConversation.id)
          .sortBy('position');
      }
      return [];
    }, [currentConversation?.id]) ?? [];



  //don't pass in the user prompt if it makes it into the arr before the request is sent
  //this is not a great solution
  const initialPrompts = useMemo(
    () => (messages.at(-1)?.role === 'user' ? messages.slice(-1) : messages),
    [messages],
  ) as (AILanguageModelAssistantPrompt | AILanguageModelUserPrompt)[];

  const { streamingResponse, loading, sendPrompt, error, abort, session, abortController } =
    useStatelessPromptAPI(currentConversation.id, {
      systemPrompt: currentConversation?.system_prompt ?? undefined,
      temperature: currentConversation?.temperature ?? 0.7,
      topK: currentConversation?.top_k ?? 10,
      initialPrompts: initialPrompts,
    });

  // TODO: The counting seems to be Debounced in the session internals, Find a was to debounce sending the input
  useEffect(() => {
    if (!session) return;
    session.countPromptTokens(input, { signal: abortController?.signal })
      .then(tokens => {
        setInputTokens(tokens)
      })
      .catch(console.error);
  }, [input, Boolean(session), abortController]);


  const addMessageToConversation = async (message: Message) => {
    if (!currentConversation?.id) return;

    try {
      const now = new Date();
      const position = await db.conversationMessage
        .where('conversation')
        .equals(currentConversation.id)
        .count();

      const id = await db.conversationMessage.add({
        conversation: currentConversation.id,
        position,
        role: message.role,
        content: message.content,
        created_at: now,
        updated_at: now,
        temperature_at_creation: currentConversation?.temperature ?? 0.7,
        top_k_at_creation: currentConversation?.top_k ?? 10,
      });

      await db.conversation.update(currentConversation.id, { updated_at: now });
      return id
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

  const handleSubmit = async () => {
    if (!currentConversation?.id) {
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description: 'No conversation started',
      });
      return;
    }
    let tempUserMessageId: number | undefined
    try {
      tempUserMessageId = await addMessageToConversation({ role: 'user', content: input });
      setInput('');
      const res = await sendPrompt(input, { streaming: true });

      if (!res) throw new Error('Model Failed to respond');
      await addMessageToConversation({ role: 'assistant', content: res });
    } catch (error) {
      console.error({ error });
      if (tempUserMessageId) {
        await db.conversationMessage.delete(tempUserMessageId)
      }
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description:
          error instanceof Error ? error.message : 'Failed to send message',
        action: (
          <ToastAction altText="Try again" onClick={() => handleSubmit()}>
            Try again
          </ToastAction>
        ),
      });
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  // Handle scroll events
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
      setShowScrollButton(!isNearBottom);
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages.length, streamingResponse, autoScroll]);

  const responseCard = (
    <MessageCard role="assistant" content={streamingResponse ?? ''} />
  );

  return (
    <>
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollAreaRef}
          className="absolute inset-0 overflow-y-auto p-4"
        >
          {error && (
            <div className="mb-4 p-4 rounded-md bg-destructive/10 text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error.message}</span>
            </div>
          )}
          {messages.map(({ role, content, id }) => (
            <MessageCard
              key={id}
              role={role as 'user' | 'assistant'}
              content={content}
            />
          ))}

          {/* Streaming Response */}
          {loading && (streamingResponse ? responseCard : <ThinkingCard />)}
          {/* Scroll-to-Bottom Button */}
          {showScrollButton && (
            <Button
              className="fixed bottom-24 left-[55%] rounded-full p-2 bg-gray-100 text-gray-600 shadow-lg hover:bg-gray-200"
              onClick={() => {
                scrollToBottom();
                setAutoScroll(true);
              }}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Add token counter before the footer */}
      <div className="px-4 py-2 text-sm text-gray-500 border-t">
        <span>Session Tokens: {session?.tokensSoFar}</span>
        <span className="mx-2">•</span>
        <span>Input Tokens: {inputTokens}</span>
        <span className="mx-2">•</span>
        <span>Tokens Left: {session?.tokensLeft}</span>
      </div>

      {/* Footer Input */}
      <footer className="bg-white border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!loading) {
                  handleSubmit();
                }
              }
            }}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            className="pr-12"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!session}
            className="absolute right-2 bottom-2 hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              if (loading) {
                abort();
              } else {
                handleSubmit();
              }
            }}
            title={loading ? 'Stop generating' : 'Send message'}
          >
            {loading ? (
              <Square className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </footer>
    </>
  );
};
