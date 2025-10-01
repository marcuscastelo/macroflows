import { z } from 'zod/v4'

export const authSessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
  token_type: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    email_confirmed_at: z.string().optional(),
    last_sign_in_at: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    user_metadata: z.record(z.string(), z.unknown()).optional(),
    app_metadata: z.record(z.string(), z.unknown()).optional(),
  }),
})

export type AuthSession = z.infer<typeof authSessionSchema>

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  emailConfirmedAt: z.string().optional(),
  lastSignInAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userMetadata: z.record(z.string(), z.unknown()).optional(),
  appMetadata: z.record(z.string(), z.unknown()).optional(),
})

export type AuthUser = z.infer<typeof authUserSchema>

export const authStateSchema = z.object({
  user: authUserSchema.nullable(),
  session: authSessionSchema.nullable(),
  isLoading: z.boolean(),
  isAuthenticated: z.boolean(),
})

export type AuthState = z.infer<typeof authStateSchema>

export type AuthProvider = 'google' | 'email'

export type SignInOptions = {
  provider: AuthProvider
  redirectTo: string
}

export type SignOutOptions = {
  redirectTo: string
}
