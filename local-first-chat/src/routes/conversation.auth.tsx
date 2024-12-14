import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { AuthSchema } from '@/utils/paramValidators';

export const Route = createFileRoute('/conversation/auth')({
  component: AuthForm,
  validateSearch: AuthSchema,
  beforeLoad: ({ context, search }) => ({
    meta: {
      title: search.authType === 'login' ? 'Login' : 'Sign Up',
      description:
        search.authType === 'login'
          ? 'Sign in to access your account'
          : 'Create a new account to get started',
    },
  }),
});

// Define form schema with Zod
const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

function AuthForm() {
  const { authType } = Route.useSearch();
  const [isLoading, setIsLoading] = useState(false);
  const isLogin = authType === 'login';
  const navigate = useNavigate();

  // Initialize forms
  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSignUp(values: SignUpFormValues) {
    try {
      setIsLoading(true);
      // await supabase.signup(values.email, values.password, {
      //   data: {
      //     name: values.name,
      //   },
      // })
      navigate({
        to: '/conversation/newchat',
        search: {
          sidebar: 'open',
        },
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      signUpForm.setError('root', {
        message: error?.message || 'Failed to sign up',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onLogin(values: LoginFormValues) {
    try {
      setIsLoading(true);
      // await supabase.login(values.email, values.password)
      // setSyncEnabled(true)
      navigate({
        to: '/conversation/newchat',
        search: {
          sidebar: 'open',
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      // You might want to show this error to the user
      loginForm.setError('root', {
        message: error?.message || 'Failed to login',
      });
    } finally {
      setIsLoading(false);
    }
  }

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
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Switch
              id="auth-mode"
              checked={isLogin}
              onCheckedChange={() =>
                navigate({
                  to: '/conversation/auth',
                  search: (curr) => ({
                    conversationOptions: 'collapsed',
                    sidebar: 'open',
                    authType: curr.authType === 'login' ? 'signup' : 'login',
                  }),
                })
              }
            />
            <Label htmlFor="auth-mode" className="text-foreground">
              {isLogin ? 'Switch to Sign Up' : 'Switch to Login'}
            </Label>
          </div>

          {isLogin ? (
            <Form {...loginForm}>
              <form
                id="loginIn"
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="space-y-4"
              >
                <FormField
                  key="login-email"
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Email</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-background border-input"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />
                <FormField
                  key="login-password"
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="bg-background border-input"
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />
                {loginForm.formState.errors.root && (
                  <div className="text-destructive text-sm">
                    {loginForm.formState.errors.root.message}
                  </div>
                )}
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Log in
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...signUpForm}>
              <form
                id="signup"
                onSubmit={signUpForm.handleSubmit(onSignUp)}
                className="space-y-4"
              >
                <FormField
                  key="signup-name"
                  control={signUpForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Name</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-background border-input"
                          placeholder="John Doe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />
                <FormField
                  key="signup-email"
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Email</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-background border-input"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />
                <FormField
                  key="signup-password"
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="bg-background border-input"
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />
                {signUpForm.formState.errors.root && (
                  <div className="text-destructive text-sm">
                    {signUpForm.formState.errors.root.message}
                  </div>
                )}
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign up
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
