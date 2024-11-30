import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../library/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../library/components/ui/form";
import { Input } from "../library/components/ui/input";
import { useState } from "react";
import { useSupabase } from "@/utils/Contexts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { setSyncEnabled } from "@/powersync/SyncMode";

export const Route = createFileRoute('/auth/signup')({
  component: SignUpForm,
})
// Define form schema with Zod
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;


function SignUpForm() {
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
      const test = await supabase?.client.auth.signUp({
        email: values.email,
        password: values.password,
      });
      console.log({test})
      setSyncEnabled(true)
      navigate({to: '/'})
      // Handle successful signup
    } catch (error) {
      console.error(error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  }

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
        </form>
      </Form>
    </div>
  );
}