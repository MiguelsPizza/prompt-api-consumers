import { BaseSession, SessionMessage } from "@/background/lib/sessionSchema";
import { UUID } from "crypto";
import { Link, useNavigate, useParams } from "react-router-dom";
import { trpc } from "../trpcClient";

/**
 * SessionDetail: Show a single session with messages.
 * We can also rename or delete the session from here.
 */
export default function SessionDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<BaseSession | null>(null)
  const [messages, setMessages] = useState<SessionMessage[]>([])

  // Fetch session + messages
  trpc.sessions.sessionLive.useSubscription(
    { sessionId: sessionId as UUID },
    {
      onData: ({ messages: newMessages, session: newSessions }) => {
        setMessages(newMessages ?? [])
        setSession(newSessions)
      },
      enabled: Boolean(sessionId),
      onError: console.error
      // queryKey: ['sessions.getSessionWithMessages', { sessionId: sessionId as UUID }],
      // initialData: [] as any
      // onError: (err) => console.error('Query error:', err),
    }
  );

  // const session = data?.session;
  // const messages = data?.messages || [];

  // Rename session mutation
  const updateSessionMutation = trpc.sessions.update.useMutation();

  // Delete session mutation
  const deleteSessionMutation = trpc.sessions.destroy.useMutation();

  const handleRenameSession = async () => {
    const newName = prompt('Enter new session name:', session?.name || '');
    if (newName && session) {
      await updateSessionMutation.mutateAsync({
        sessionId: session.id,
        name: newName,
      });
    }
  };

  const handleDeleteSession = async () => {
    if (session) {
      if (confirm('Are you sure you want to delete this session?')) {
        await deleteSessionMutation.mutateAsync({ sessionId: session.id });
        navigate('/');
      }
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-2">Session Detail</h1>
      {session ? (
        <>
          <div className="mb-4">
            <div className="text-gray-800">
              <strong>Name:</strong> {session.name || '(no name)'}
            </div>
            <div className="text-gray-800">
              <strong>ID:</strong> {session.id}
            </div>
          </div>
          <div className="flex space-x-2 mb-4">
            <button
              onClick={handleRenameSession}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              Rename Session
            </button>
            <button
              onClick={handleDeleteSession}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Delete Session
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-gray-300 text-black rounded inline-block"
            >
              Back
            </Link>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Messages</h2>
            {messages && messages.length > 0 ? (
              <ul className="space-y-2">
                {messages.map((message: any) => (
                  <li key={message.id || `${message.role}-${message.position}`}>
                    <div
                      className={`p-2 rounded ${message.role === 'user'
                        ? 'bg-blue-100'
                        : 'bg-green-100'
                        }`}
                    >
                      <strong>{message.role}:</strong> {message.content}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No messages.</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-gray-600">Session not found.</p>
      )}
    </div>
  );
}