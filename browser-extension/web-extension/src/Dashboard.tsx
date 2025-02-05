// // Dashboard.tsx
// import { Button } from "@local-first-web-ai-monorepo/react-ui/components/button";
// import { useState } from "react";
// // import SessionList from "../entrypoints/popup/routes/SessionList";
// import ModelList from "./ModelList";

// /**
//  * Dashboard component that allows the user to toggle between different list views.
//  *
//  * This component is designed to be extensible so you can add more list routes or features later.
//  */
// export default function Dashboard() {
//   const [activeTab, setActiveTab] = useState<"sessions" | "models">("sessions");

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
//       <div className="flex space-x-2 mb-4">
//         <Button
//           variant={activeTab === "sessions" ? "default" : "outline"}
//           onClick={() => setActiveTab("sessions")}
//         >
//           Sessions
//         </Button>
//         <Button
//           variant={activeTab === "models" ? "default" : "outline"}
//           onClick={() => setActiveTab("models")}
//         >
//           Models
//         </Button>
//       </div>
//       <div>
//         {activeTab === "sessions" && <SessionList />}
//         {activeTab === "models" && <ModelList />}
//       </div>
//     </div>
//   );
// }