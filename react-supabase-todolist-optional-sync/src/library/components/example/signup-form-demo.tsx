import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { useState } from "react";
import { useSupabase } from "../providers/SystemProvider";
import { useNavigate } from "@tanstack/react-router";

// Define form schema with Zod
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabase();
  const navigate = useNavigate()

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form submission handler
  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);
      await supabase?.client.auth.signUp({
        email: values.email,
        password: values.password,
      });
      navigate({to: '/chat'})
      // Handle successful signup
    } catch (error) {
      console.error(error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  }

  // Social login handlers
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await supabase?.client.auth.signInWithOAuth({
        provider: 'google',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setIsLoading(true);
      await supabase?.client.auth.signInWithOAuth({
        provider: 'github',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        Create your account
      </h2>
      <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
        Sign up to get started with our application
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="my-8">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            className="w-full mt-6"
            type="submit"
            disabled={isLoading}
          >
            Sign up →
          </Button>

          <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

          <div className="flex flex-col space-y-4">
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={handleGithubLogin}
              className="flex items-center justify-center gap-2"
            >
              <IconBrandGithub className="h-4 w-4" />
              <span>Continue with GitHub</span>
            </Button>

            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2"
            >
              <IconBrandGoogle className="h-4 w-4" />
              <span>Continue with Google</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}