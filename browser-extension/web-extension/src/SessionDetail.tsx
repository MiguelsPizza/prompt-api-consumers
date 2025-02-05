// import { BaseSession, SessionMessage } from "@/background/lib/sessionSchema";
// import { Alert, AlertDescription, AlertTitle } from "@local-first-web-ai-monorepo/react-ui/components/alert";
// import { Input } from "@local-first-web-ai-monorepo/react-ui/components/input";

// import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@local-first-web-ai-monorepo/react-ui/components/card";
// import { ScrollArea } from "@local-first-web-ai-monorepo/react-ui/components/scroll-area";
// import { UUID } from "crypto";
// import { useState } from "react";
// import { Link, useNavigate, useParams } from "react-router-dom";
// import { trpc } from "../entrypoints/popup/trpcClient";
// /**
//  * SessionDetail: Show a single session with messages.
//  * We can also rename or delete the session from here.
//  */
// export default function SessionDetail() {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const [prompt, setPrompt] = useState('')
//   const [session, setSession] = useState<BaseSession | null>(null)
//   const [messages, setMessages] = useState<SessionMessage[]>([])

//   // Fetch session + messages
//   trpc.sessions.sessionLive.useSubscription(
//     { sessionId: sessionId as UUID },
//     {
//       onData: ({ messages: newMessages, session: newSessions }) => {
//         setMessages(newMessages ?? [])
//         setSession(newSessions)
//       },
//       enabled: Boolean(sessionId),
//       onError: console.error
//     }
//   );
//   // Rename session mutation
//   const updateSessionMutation = trpc.sessions.update.useMutation();
//   // Delete session mutation
//   const deleteSessionMutation = trpc.sessions.destroy.useMutation();

//   const chatWithModelMutation = trpc.languageModel.prompt.useMutation()

//   const handleRenameSession = async () => {
//     // const newName = prompt('Enter new session name:', session?.name || '');
//     // if (newName && session) {
//     //   await updateSessionMutation.mutateAsync({
//     //     sessionId: session.id,
//     //     name: newName,
//     //   });
//     // }
//   };

//   const handleDeleteSession = async () => {
//     if (session) {
//       if (confirm('Are you sure you want to delete this session?')) {
//         await deleteSessionMutation.mutateAsync({ sessionId: session.id });
//         navigate('/');
//       }
//     }
//   };

//   const sendMessage = async () => {
//     if (!sessionId) return
//     const { error, result } = await chatWithModelMutation.mutateAsync({ message: { content: prompt, role: 'user' }, sessionId })
//     if (error) return console.error(error)
//     setPrompt('')
//   }

//   return (
//     <div className="p-4 space-y-4">

//       <h1 className="text-2xl font-bold">Session Detail</h1>
//       {session ? (
//         <>
//           <Card>
//             <CardHeader>
//               <CardTitle>Session Information</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-2">
//               <div className="text-sm">
//                 <span className="font-medium">Name:</span> {session.name || '(no name)'}
//               </div>
//               <div className="text-sm">
//                 <span className="font-medium">ID:</span> {session.id}
//               </div>
//               <div className="flex space-x-2 mt-4">
//                 <Button variant="secondary" onClick={handleRenameSession}>
//                   Rename Session
//                 </Button>
//                 <Button variant="destructive" onClick={handleDeleteSession}>
//                   Delete Session
//                 </Button>
//                 <Button variant="outline" asChild>
//                   <Link to="/">Back</Link>
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Messages</CardTitle>
//               <Input value={prompt} onChange={e => setPrompt(e.target.value)} />
//               <Button onClick={sendMessage} />
//             </CardHeader>
//             <CardContent>
//               <ScrollArea className="h-[400px]">
//                 {messages && messages.length > 0 ? (
//                   <div className="space-y-2">
//                     {messages.map((message: any) => (
//                       <Alert
//                         key={message.id || `${message.role}-${message.position}`}
//                         variant={message.role === 'user' ? 'default' : 'destructive'}
//                       >
//                         <AlertTitle className="capitalize">{message.role}</AlertTitle>
//                         <AlertDescription>{message.content}</AlertDescription>
//                       </Alert>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="text-muted-foreground">No messages.</p>
//                 )}
//               </ScrollArea>
//             </CardContent>
//           </Card>
//         </>
//       ) : (
//         <Alert variant="destructive">
//           <AlertTitle>Not Found</AlertTitle>
//           <AlertDescription>Session not found.</AlertDescription>
//         </Alert>
//       )}
//     </div>
//   );
// }