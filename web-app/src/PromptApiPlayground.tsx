import React, { useState, useRef, useEffect } from 'react';
import { useOptimizedLanguageModel } from './useOptimizedLanguageModel';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const sanitizeHtml = (html) => {
  // In a real app, you'd want to use DOMPurify or similar
  return html;
};

export default function OptimizedChat() {
  const [input, setInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const chatEndRef = useRef(null);

  const {
    sendPrompt,
    history,
    response,
    loading,
    error,
    abortController,
    clearHistory,
    available
  } = useOptimizedLanguageModel({
    useSession: true,
    systemPrompt: "You are a helpful AI assistant.",
    modelOptions: {
      temperature: 0.7
    }
  });

  useEffect(() => {
    if (autoScroll) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, response]);

  const handleSubmit = async (streaming = true) => {
    if (!input.trim() || loading) return;

    try {
      await sendPrompt(input, { streaming });
      setInput('');
    } catch (err) {
      console.error('Error sending prompt:', err);
    }
  };

  if (!available) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Language Model API is not available in your browser.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div
                className="prose prose-sm"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(message.content)
                }}
              />
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {loading && response && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
              <div
                className="prose prose-sm"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(response)
                }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mx-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={() => clearHistory()}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Chat
          </button>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            {autoScroll ? 'Disable' : 'Enable'} Auto-scroll
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex space-x-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-h-[44px] max-h-32 p-2 border rounded-lg resize-y"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex flex-col space-y-2">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Send
            </button>
            {loading && abortController && (
              <button
                onClick={() => abortController.abort()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Stop
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}