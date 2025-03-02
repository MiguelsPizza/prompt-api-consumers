import { RootSchema } from '@/utils/paramValidators';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  validateSearch: RootSchema,
  beforeLoad: async ({ navigate, search }) => {
    navigate({ to: '/conversation/newchat', search: search });
  },
});
