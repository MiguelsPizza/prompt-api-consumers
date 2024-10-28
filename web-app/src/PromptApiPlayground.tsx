import { useState, useEffect, useRef, memo } from 'react';
import { useStatelessPromptAPI } from 'use-prompt-api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { PlusCircle, Settings, Send, ArrowDown, Square, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './local-db/db';
import type { ModelConversation } from 'use-prompt-api';
import { MessageCard } from './components/chat/MessageCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessagesProps {
  currentConversationId: number | null
  loading: boolean;
  response: string | null;
}


const ThinkingCard = () => {
  const [number, setNumber] = useState(1)

  useEffect(() => {
    const int = setInterval(() => setNumber(curr => (curr + 1) % 4), 300)
    return () => clearInterval(int)
  }, [])

  return (
    <MessageCard
      role="assistant"
      content={`thinking${'.'.repeat(number)}`}
    />
  )
}

const ChatMessages = memo(({ currentConversationId, loading, response }: ChatMessagesProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messages = useLiveQuery(
    async () => {
      if (currentConversationId != null) {
        const msgs = await db.conversationMessage
          .where('conversation')
          .equals(currentConversationId)
          .sortBy('position');
        return msgs.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }));
      }
      return [];
    },
    [currentConversationId]
  ) ?? []

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
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
      scrollToBottom('smooth');
    }
  }, [messages, response, autoScroll]);


  const responseCard = (
    <MessageCard
      role="assistant"
      content={response ?? ''}
    />
  );

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={scrollAreaRef}
        className="absolute inset-0 overflow-y-auto p-4"
      >
        {messages.map(({role, content, id}) => (
          <MessageCard
            key={id}
            role={role as "user" | "assistant"}
            content={content}
          />
        ))}

        {/* Streaming Response */}
        {loading ? (
          response ? responseCard : <ThinkingCard />
        ) : null}
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
  );
});

export default function ChatInterface() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(1);
  const [input, setInput] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // New state for sidebar visibility

  const currentConversation = useLiveQuery(
    async () => {
      if (currentConversationId) {
        return await db.conversation.get(currentConversationId);
      }
    },
    [currentConversationId]
  );

  const {
    response,
    loading,
    sendPrompt,
    abort
  } = useStatelessPromptAPI({
    systemPrompt: currentConversation?.system_prompt ?? undefined,
    temperature: currentConversation?.temperature ?? 0.7,
    topK: currentConversation?.top_k ?? 10,
  });

  const conversations = useLiveQuery(() => db.conversation.toArray());

  // Add assistant's response to conversation when loading completes
  useEffect(() => {
    const handleResponse = async () => {
      if (!loading && response && currentConversationId) {
        // Check if this response was already added
        const lastMessage = await db.conversationMessage
          .where('conversation')
          .equals(currentConversationId)
          .reverse()
          .first();

        if (lastMessage?.content !== response || lastMessage?.role !== 'assistant') {
          await addMessageToConversation({ role: 'assistant', content: response });
        }
      }
    };

    handleResponse();
  }, [loading, response, currentConversationId]);

  const handleDeleteConversation = async (id: number) => {
    try {
      await db.conversationMessage
        .where('conversation')
        .equals(id)
        .delete();

      await db.conversation.delete(id);

      const newCurrentConversation = await db.conversation.toArray()
      if (newCurrentConversation.length < 1) {
        handleNewConversation()
      } else {
        setCurrentConversationId(newCurrentConversation[0].id)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const addMessageToConversation = async (message: Message) => {
    if (!currentConversationId) return;

    try {
      const now = new Date();
      const position = await db.conversationMessage
        .where('conversation')
        .equals(currentConversationId)
        .count();

      await db.conversationMessage.add({
        conversation: currentConversationId,
        position,
        role: message.role,
        content: message.content,
        created_at: now,
        updated_at: now,
        temperature_at_creation: currentConversation?.temperature ?? .7,
        top_k_at_creation: currentConversation?.top_k ?? 10,
      });

      await db.conversation.update(currentConversationId, { updated_at: now });
    } catch (error) {
      console.error('Error adding message to conversation:', error);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || currentConversationId === null) return;

    // Add the user's message to the conversation
    await addMessageToConversation({ role: 'user', content: input });
    setInput('');

    try {
      // Fetch the conversation messages
      const conversationMessages = await db.conversationMessage
        .where('conversation')
        .equals(currentConversationId)
        .sortBy('position');

      // Exclude the last message (the user's current input)
      const historyMessages = conversationMessages.slice(0, -1);

      const history = historyMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })) as ModelConversation;

      // Send the prompt with the user's input and conversation history
      await sendPrompt(input, { streaming: true, history });
    } catch (error) {
      console.error('Error sending prompt:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const now = new Date();
      const id = await db.conversation.add({
        name: 'New conversation',
        conversation_summary: null,
        system_prompt: null,
        created_at: now,
        updated_at: now,
        top_k: 10,
        temperature: 0.7,
      });
      setCurrentConversationId(id);
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-64'
          }`}
      >
        {!sidebarCollapsed && (
          <>
            <div className="p-4">
              <Button
                variant="outline"
                className="w-full mb-4 text-gray-900 hover:text-green-500"
                onClick={handleNewConversation}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> New chat
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                {conversations?.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center mb-2 group"
                  >
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start bg-gray-800 text-white hover:bg-gray-700 hover:text-green-500 transition-colors duration-300"
                      onClick={() => setCurrentConversationId(conversation.id)}
                    >
                      {conversation.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-red-900 hover:text-red-500"
                      onClick={() => handleDeleteConversation(conversation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-4 flex justify-between items-center">
          <div className="flex items-center">
            {/* Toggle Sidebar Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="mr-2"
            >
              {sidebarCollapsed ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </Button>
            <h1 className="text-xl font-bold">Chat</h1>
          </div>

          {/* Settings Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <div className="flex flex-col w-full">
                  <label htmlFor="temperature">
                    Temperature: {currentConversation?.temperature ?? 0.7}
                  </label>
                  <Slider
                    id="temperature"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[currentConversation?.temperature ?? 0.7]}
                    onValueChange={(value) => {
                      if (currentConversationId != null) {
                        db.conversation.update(currentConversationId, {
                          temperature: value[0],
                          updated_at: new Date(),
                        });
                      }
                    }}
                  />
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col w-full">
                  <label htmlFor="topK">Top K: {currentConversation?.top_k ?? 10}</label>
                  <Slider
                    id="topK"
                    min={1}
                    max={100}
                    step={1}
                    value={[currentConversation?.top_k ?? 10]}
                    onValueChange={(value) => {
                      if (currentConversationId != null) {
                        db.conversation.update(currentConversationId, {
                          top_k: value[0],
                          updated_at: new Date(),
                        });
                      }
                    }}
                  />
                </div>

              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {currentConversationId && (
                <>
                  <DropdownMenuItem
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteConversation(currentConversationId)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Conversation
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Chat Messages */}
        <ChatMessages currentConversationId={currentConversationId} loading={loading} response={response} />

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
              placeholder="Type your message here..."
              className="pr-12"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 bottom-2"
              onClick={(e) => {
                e.preventDefault();
                if (loading) {
                  abort();
                } else {
                  handleSubmit();
                }
              }}
            >
              {loading ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </footer>
      </div>
    </div>
  );
}