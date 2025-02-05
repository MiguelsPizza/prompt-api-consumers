import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

// Base schema for shared search params if needed
const BaseSearchSchema = z.object({});

// Schema for /sessions route
export const SessionsSearchSchema = BaseSearchSchema.extend({});

// Schema for /sessions/$sessionId route
export const SessionDetailSearchSchema = BaseSearchSchema.extend({});

// Param schema for /sessions/$sessionId route
export const SessionDetailParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

// Export validators
export const SessionsValidator = {
  search: zodValidator(SessionsSearchSchema),
};

export const SessionDetailValidator = {
  params: zodValidator(SessionDetailParamsSchema),
  search: zodValidator(SessionDetailSearchSchema),
};

// Export types
export type SessionsSearch = z.infer<typeof SessionsSearchSchema>;
export type SessionDetailSearch = z.infer<typeof SessionDetailSearchSchema>;
export type SessionDetailParams = z.infer<typeof SessionDetailParamsSchema>;
