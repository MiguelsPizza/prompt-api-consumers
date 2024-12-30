import { createFileRoute } from '@tanstack/react-router';
import { RootSchema } from '@/utils/paramValidators';
import { useDrizzlePGlite } from '@/dataLayer';

export const Route = createFileRoute('/')({
  validateSearch: RootSchema,
  beforeLoad: async ({ navigate, search }) => {
    navigate({ to: '/conversation/newchat', search: search });
  },
});
