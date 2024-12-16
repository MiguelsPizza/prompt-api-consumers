import { createFileRoute } from '@tanstack/react-router';
import { RootSchema } from '@/utils/paramValidators';
import { db } from '@/dataLayer/db';

export const Route = createFileRoute('/')({
  validateSearch: RootSchema,
  beforeLoad: async ({ navigate, search }) => {
    navigate({ to: '/conversation/newchat', search: search });
  },
});
