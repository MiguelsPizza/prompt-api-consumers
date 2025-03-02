import { z } from 'zod';

const envSchema = z
  .object({
    FPX_ENDPOINT: z.string().url(),
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().startsWith('sk_'),
    CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
    API_VERSION: z
      .string()
      .startsWith('v')
      .regex(/^v\d+$/, 'API version must be in format "v1", "v2", etc.'),
    SIGNING_SECRET: z.string(),
  })
  .strict();

// Type inference
export type Env = z.infer<typeof envSchema>;

// Validate environment variables
export function validateEnv(): Env {
  const env: Partial<Env> = {
    FPX_ENDPOINT: process.env.FPX_ENDPOINT,
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    API_VERSION: process.env.API_VERSION,
    SIGNING_SECRET: process.env.SIGNING_SECRET,
  };
  console.log({ env });

  const result = envSchema.safeParse(env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

// export const environmentVars = validateEnv();
