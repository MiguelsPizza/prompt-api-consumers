import type { AppRouter } from '@/background/routers';
import { createTRPCProxyClient } from '@trpc/client';
import { useState } from 'react';
import { chromeLink } from '../../../../src/link/index';

const port = chrome.runtime.connect();
const trpc = createTRPCProxyClient<AppRouter>({
  links: [chromeLink({ port })],
});

function Popup() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: "system" | "user" | "assistant", content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  const downloadModel = async () => {
    setErrorMessage(null);
    try {
      await trpc.mlc.reload.mutate({
        modelId: "SmolLM2-360M-Instruct-q4f16_1-MLC"
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  const chatWithModel = async (chat: string) => {
    const { choices } = await trpc.mlc.chat.query({
      modelId: "SmolLM2-360M-Instruct-q4f16_1-MLC",
      messages: [{ role: 'user', content: chat }, ...messages]
    })
    const newMessage = choices[0].message
    setMessages((currMessages) => [{ role: 'assistant', content: newMessage.content! }, ...currMessages])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message to state
    setMessages((curr) => [{ role: 'user', content: inputMessage }, ...curr]);

    try {
      await chatWithModel(inputMessage);
      setInputMessage(""); // Clear input after sending
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Chat failed');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        gap: 8,
        width: '400px',
        height: '500px'
      }}
    >
      <h2>Extension using tRPC & Plasmo</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <button onClick={downloadModel}>Download Model</button>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #ccc',
          borderRadius: 4,
          padding: 8,
          marginBottom: 8
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: 8,
              padding: 8,
              backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              borderRadius: 4
            }}
          >
            <strong>{msg.role}: </strong>
            {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Send</button>
      </form>
    </div>
  );
}

export default Popup;
