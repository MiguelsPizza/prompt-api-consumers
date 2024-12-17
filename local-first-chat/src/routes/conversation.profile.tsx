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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Loader2, LogOut, Pencil, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const Route = createFileRoute('/conversation/profile')({
  component: ProfileForm,
  beforeLoad: ({ context }) => ({
    meta: {
      title: 'Profile',
      description: 'Manage your account settings',
    },
  }),
});

function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  // const user = supabase.currentSession?.user

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
    },
  });

  // if (!user) {
  //   navigate({ to: '/conversation/auth', search: { authType: 'login' } })
  //   return null
  // }

  async function handleLogout() {
    try {
      setIsLoading(true);
      // await supabase.logout()
      // setSyncEnabled(false)
      navigate({
        to: '/conversation/auth',
        search: {
          authType: 'login',
          sidebar: 'open',
        },
      });
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    try {
      setIsLoading(true);
      // await supabase.client.auth.updateUser({
      //   data: { name: values.name }
      // })
      setIsEditing(false);
    } catch (error: any) {
      console.error('Update error:', error);
      form.setError('root', {
        message: error?.message || 'Failed to update profile',
      });
    } finally {
      setIsLoading(false);
    }
  }
  return null;

  // return (
  //   <div className="min-h-screen flex items-center justify-center bg-background">
  //     <Card className="max-w-md w-full mx-auto border-border">
  //       <CardHeader>
  //         <div className="flex items-center justify-between">
  //           <div>
  //             <CardTitle className="text-foreground">Profile</CardTitle>
  //             <CardDescription className="text-muted-foreground">
  //               Manage your account settings
  //             </CardDescription>
  //           </div>
  //           <Avatar className="h-16 w-16">
  //             <AvatarImage src={user.user_metadata?.avatar_url} />
  //             <AvatarFallback className="text-lg">
  //               {user.email?.[0].toUpperCase()}
  //             </AvatarFallback>
  //           </Avatar>
  //         </div>
  //       </CardHeader>
  //       <CardContent className="space-y-4">
  //         <div className="space-y-2">
  //           <label className="text-sm font-medium text-muted-foreground">
  //             Email
  //           </label>
  //           <div className="text-foreground">{user.email}</div>
  //         </div>

  //         <Form {...form}>
  //           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
  //             <div className="flex items-center justify-between">
  //               <FormLabel className="text-sm font-medium text-muted-foreground">
  //                 Name
  //               </FormLabel>
  //               {!isEditing && (
  //                 <Button
  //                   type="button"
  //                   variant="ghost"
  //                   size="sm"
  //                   onClick={() => setIsEditing(true)}
  //                 >
  //                   <Pencil className="h-4 w-4" />
  //                 </Button>
  //               )}
  //             </div>
  //             {isEditing ? (
  //               <FormField
  //                 control={form.control}
  //                 name="name"
  //                 render={({ field }) => (
  //                   <FormItem>
  //                     <FormControl>
  //                       <div className="flex gap-2">
  //                         <Input
  //                           className="bg-background border-input"
  //                           placeholder="Your name"
  //                           {...field}
  //                         />
  //                         <Button
  //                           type="submit"
  //                           disabled={isLoading}
  //                           size="sm"
  //                         >
  //                           {isLoading ? (
  //                             <Loader2 className="h-4 w-4 animate-spin" />
  //                           ) : (
  //                             <Save className="h-4 w-4" />
  //                           )}
  //                         </Button>
  //                       </div>
  //                     </FormControl>
  //                     <FormMessage className="text-destructive" />
  //                   </FormItem>
  //                 )}
  //               />
  //             ) : (
  //               <div className="text-foreground">
  //                 {user.user_metadata?.name || 'Not set'}
  //               </div>
  //             )}
  //           </form>
  //         </Form>

  //         <div className="space-y-2">
  //           <label className="text-sm font-medium text-muted-foreground">
  //             Account Created
  //           </label>
  //           <div className="text-foreground">
  //             {new Date(user.created_at).toLocaleDateString()}
  //           </div>
  //         </div>

  //         <Separator className="my-4" />

  //         <Button
  //           className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
  //           onClick={handleLogout}
  //           disabled={isLoading}
  //         >
  //           {isLoading ? (
  //             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  //           ) : (
  //             <LogOut className="mr-2 h-4 w-4" />
  //           )}
  //           Log out
  //         </Button>
  //       </CardContent>
  //     </Card>
  //   </div>
  // )
}
