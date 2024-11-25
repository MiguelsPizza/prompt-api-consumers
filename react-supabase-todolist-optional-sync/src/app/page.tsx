import React from 'react';
import { useSupabase } from '@/components/providers/SystemProvider';
import { useNavigate } from '@tanstack/react-router';

export type LoginFormParams = {
  email: string;
  password: string;
};

/**
 * This page shows a loading spinner we detect a session
 * and redirect either to the app or auth flow.
 */
export default function EntryPage() {
  const connector = useSupabase();
  const navigate = useNavigate();

//   const navigateToMainView = () => {
//     navigate({to: '/chat'});
//   };

//   React.useEffect(() => {
//     if (!connector) {
//       console.error(`No Supabase connector has been created yet.`);
//       return;
//     }

//     if (!connector.ready) {
//       // const l = connector.registerListener({
//       //   initialized: () => {
//       //     /**
//       //      * Redirect if on the entry view
//       //      */

//       //     navigate({to: '/chat'});
//       //   }
//       // });
//       // return () => l?.();
//     }
// //  if(!)
//     navigateToMainView();
//   }, [connector]);

  return 'loading'
}
