import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AuthSchema } from '@/utils/paramValidators';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/conversation/auth')({
  component: AuthForm,
  validateSearch: AuthSchema,
  beforeLoad: ({ search }) => ({
    meta: {
      title: search.authType === 'login' ? 'Login' : 'Sign Up',
      description:
        search.authType === 'login'
          ? 'Sign in to access your account'
          : 'Create a new account to get started',
    },
  }),
});

function AuthForm() {
  const { authType } = Route.useSearch();
  const navigate = useNavigate();
  const isLogin = authType === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full mx-auto border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isLogin
              ? 'Sign in to access your account'
              : 'Sign up to get started with our application'}
          </CardDescription>
        </CardHeader>
        <CardContent>{isLogin ? <SignIn /> : <SignUp />}</CardContent>
      </Card>
    </div>
  );
}
