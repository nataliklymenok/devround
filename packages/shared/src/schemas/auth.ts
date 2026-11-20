import { z } from 'zod'

export const GoogleSignInRequestSchema = z.object({
  /** Google Identity Services ID token */
  credential: z.string().min(1).max(4096),
})
export type GoogleSignInRequest = z.infer<typeof GoogleSignInRequestSchema>

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
})
export type User = z.infer<typeof UserSchema>

export const MeResponseSchema = z.object({
  user: UserSchema,
  hasActivePlan: z.boolean(),
})
export type MeResponse = z.infer<typeof MeResponseSchema>
