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
import { UserProfile } from '@clerk/clerk-react';

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
  return <UserProfile />;
}
