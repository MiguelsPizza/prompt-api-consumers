import { db } from '@/background/lib/sessionArchiveDB';
import type { AppRouter } from '@/background/routers';
import { chromeLink } from '@/chromeTrpcAdditions/trpc-browser/link';
import { createTRPCProxyClient } from '@trpc/client';
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from 'react';

const port = chrome.runtime.connect();
const trpc = createTRPCProxyClient<AppRouter>({
  links: [chromeLink({ port })],
});

function Popup() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messages = useLiveQuery(() => sessionId ? db.session_messages.filter((m) => true).sortBy('position') : []) ?? []
  const [inputMessage, setInputMessage] = useState("");
  console.log({ messages, sessionId })
  const downloadModel = async () => {
    setErrorMessage(null);
    try {
      const newSession = window.crypto.randomUUID()
      await trpc.mlc.reload.mutate({
        modelId: "SmolLM2-360M-Instruct-q4f16_1-MLC",
        chatOpts: {},
        requesterURL: 'popup',
        sessionId: newSession,
      })
      setSessionId(newSession)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  const chatWithModel = async (chat: string) => {
    if (!sessionId) return
    console.log("sending chat")
    const { choices } = await trpc.mlc.chat.query({
      modelId: "SmolLM2-360M-Instruct-q4f16_1-MLC",
      sessionId: sessionId,
      message: {
        content: chat,
        role: 'user'
      }
    })
    console.log({ choices })
    // const newMessage = choices[0].message
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message to state

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
