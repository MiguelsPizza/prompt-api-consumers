import React from 'react';
import { useSupabase } from '@/components/providers/SystemProvider';
import { LoginDetailsWidget } from '@/components/widgets/LoginDetailsWidget';
import { useNavigate } from '@tanstack/react-router';
import SignUpForm from '@/components/example/signup-form-demo';

export default function RegisterPage() {
  const supabase = useSupabase();
  const navigate = useNavigate();

  return (
    <SignUpForm/>
    // <LoginDetailsWidget
    //   title="Register"
    //   submitTitle="Register"
    //   onSubmit={async ({ email, password }) => {
    //     if (!supabase) {
    //       throw new Error('Supabase has not been initialized yet');
    //     }
    //     const {
    //       data: { session },
    //       error
    //     } = await supabase.client.auth.signUp({ email, password });
    //     if (error) {
    //       throw new Error(error.message);
    //     }

    //     if (session) {
    //       supabase.updateSession(session);
    //       navigate({to: '/'});
    //       return;
    //     }

    //     alert('Registration successful, please login');
    //     navigate({to: '/auth/login'});
    //   }}
    //   secondaryActions={[{ title: 'Back', onClick: () => navigate({to: '/auth/login'}) }]}
    // />
  );
}
