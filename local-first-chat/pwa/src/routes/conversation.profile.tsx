import { UserProfile } from '@clerk/clerk-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';

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
