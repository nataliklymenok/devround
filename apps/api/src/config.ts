import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    AUTH_PROVIDER: z.enum(['google', 'fake']).default('google'),
    WEB_ORIGIN: z.url(),
    PORT: z.coerce.number().int().positive().default(3000),
    CONTENT_DIR: z.string().default('../../content'),
    WEB_DIST_DIR: z.string().default('../web/dist'),
  })
  .superRefine((env, ctx) => {
    if (env.AUTH_PROVIDER === 'fake' && env.NODE_ENV === 'production') {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_PROVIDER'],
        message: 'fake auth is not allowed in production',
      })
    }
    if (env.AUTH_PROVIDER === 'google' && !env.GOOGLE_CLIENT_ID) {
      ctx.addIssue({
        code: 'custom',
        path: ['GOOGLE_CLIENT_ID'],
        message: 'required when AUTH_PROVIDER=google',
      })
    }
  })

export type Config = z.infer<typeof EnvSchema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = EnvSchema.safeParse(env)
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`)
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`)
  }
  return result.data
}
