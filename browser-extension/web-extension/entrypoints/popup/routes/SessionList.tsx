import type { BaseSession } from "@/background/lib/sessionSchema";
import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../trpcClient";

/**
 * SessionList: Show a list of sessions with live updates.
 * We can also create a new session here.
 */
export default function SessionList() {
  const [sessions, setSessions] = useState<BaseSession[]>([])
  // Subscription to all sessions:
  trpc.sessions.allLive.useSubscription(undefined, {
    onData: (data) => setSessions(data),
    onError: (err) => console.error('Subscription error:', err),
  });

  // Create a new session mutation:
  const createSessionMutation = trpc.sessions.create.useMutation();
  const navigate = useNavigate();

  // Create new session handler:
  const handleCreateSession = async () => {
    const sessionId = crypto.randomUUID();
    await createSessionMutation.mutateAsync({
      sessionId,
      name: `Session ${sessionId.slice(0, 4)}`,
      hostURL: 'popup',
      llm_id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', // or whichever default model you want
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      topK: 40,
    });
    // Navigate to new session detail page:
    navigate(`/sessions/${sessionId}`);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sessions</h1>
      <button
        onClick={handleCreateSession}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Create New Session
      </button>
      {sessions?.length ? (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                to={`/sessions/${session.id}`}
                className="block p-2 bg-white shadow rounded hover:bg-gray-200"
              >
                <span className="font-medium">{session.name || '(Unnamed)'}</span>
                <span className="ml-2 text-sm text-gray-600">ID: {session.id}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No sessions yet.</p>
      )}
    </div>
  );
}