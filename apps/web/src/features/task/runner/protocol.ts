import type { RunRequest } from '@devround/shared'
import { z } from 'zod'

/** Messages from the sandbox iframe (contracts/code-runner.md); anything else is ignored. */
export const SandboxMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready'), version: z.literal(1) }),
  z.object({
    type: z.literal('result'),
    version: z.literal(1),
    runId: z.string(),
    cases: z.array(
      z.object({
        name: z.string(),
        status: z.enum(['passed', 'failed', 'error']),
        message: z.string().optional(),
        expected: z.string().optional(),
        actual: z.string().optional(),
        durationMs: z.number(),
      }),
    ),
    console: z.array(z.string()),
    totalMs: z.number(),
  }),
  z.object({
    type: z.literal('fatal'),
    version: z.literal(1),
    runId: z.string(),
    message: z.string(),
  }),
])
export type SandboxMessage = z.infer<typeof SandboxMessageSchema>
export type SandboxResult = Extract<SandboxMessage, { type: 'result' }>

export interface RunMessage extends RunRequest {
  type: 'run'
  version: 1
  runId: string
  workerSource: string
}
