import { createHarness, type RunRequest } from '@devround/shared'
import { SandboxMessageSchema, type RunMessage, type SandboxResult } from './protocol'

/** Total wall-clock limit per run (FR-015a). */
export const RUN_TIMEOUT_MS = 5000
const READY_TIMEOUT_MS = 3000

export type RunOutcome =
  | { kind: 'result'; result: SandboxResult }
  | { kind: 'timeout' }
  | { kind: 'fatal'; message: string }
  | { kind: 'unavailable' }

/**
 * Worker code: the self-contained shared harness plus a tiny message bootstrap. Sent to the sandbox
 * in the run message so nothing is loaded from our origin inside it.
 */
const WORKER_SOURCE = `
const createHarness = (${createHarness.toString()});
const harness = createHarness({
  compile: (source, params) => new Function(...params, source),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  now: () => performance.now(),
});
onmessage = async (event) => {
  const { runId, code, entry, tests, perCaseTimeoutMs } = event.data;
  try {
    const result = await harness.run({ code, entry, tests, perCaseTimeoutMs });
    postMessage({ type: 'result', version: 1, runId, ...result });
  } catch (error) {
    postMessage({ type: 'fatal', version: 1, runId, message: String(error && error.message || error) });
  }
};
`

/**
 * The sandbox document: opaque origin (sandbox without allow-same-origin), no network (CSP), runs the
 * harness in a blob Worker and relays messages. 'unsafe-eval' is needed for new Function in the worker.
 */
const SRCDOC = `<!doctype html>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:">
<script>
  let worker = null;
  window.addEventListener('message', (event) => {
    if (event.source !== parent) return;
    const msg = event.data;
    if (!msg || msg.type !== 'run' || msg.version !== 1) return;
    try {
      worker = new Worker(URL.createObjectURL(new Blob([msg.workerSource], { type: 'text/javascript' })));
    } catch (error) {
      parent.postMessage({ type: 'fatal', version: 1, runId: msg.runId, message: 'Could not start the code runner' }, '*');
      return;
    }
    worker.onmessage = (e) => parent.postMessage(e.data, '*');
    worker.onerror = (e) => {
      e.preventDefault();
      parent.postMessage({ type: 'fatal', version: 1, runId: msg.runId, message: e.message || 'Runner error' }, '*');
    };
    worker.postMessage({ runId: msg.runId, code: msg.code, entry: msg.entry, tests: msg.tests, perCaseTimeoutMs: msg.perCaseTimeoutMs });
  });
  parent.postMessage({ type: 'ready', version: 1 }, '*');
</script>`

/**
 * Run user code against test cases in a fresh sandboxed iframe. The iframe (and its worker) is
 * removed after the result or the time limit, which also stops infinite loops.
 */
export function runInSandbox(request: RunRequest, timeoutMs = RUN_TIMEOUT_MS): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const runId = crypto.randomUUID()
    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.title = 'Code runner'
    iframe.style.display = 'none'
    iframe.srcdoc = SRCDOC

    let settled = false
    let started = false
    const finish = (outcome: RunOutcome) => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onMessage)
      clearTimeout(readyTimer)
      clearTimeout(runTimer)
      iframe.remove() // terminates the worker
      resolve(outcome)
    }

    let runTimer: ReturnType<typeof setTimeout> | undefined
    const readyTimer = setTimeout(() => {
      if (!started) finish({ kind: 'unavailable' })
    }, READY_TIMEOUT_MS)

    function onMessage(event: MessageEvent) {
      if (event.source !== iframe.contentWindow) return
      const parsed = SandboxMessageSchema.safeParse(event.data)
      if (!parsed.success) return
      const msg = parsed.data
      if (msg.type === 'ready' && !started) {
        started = true
        runTimer = setTimeout(() => finish({ kind: 'timeout' }), timeoutMs)
        const run: RunMessage = {
          type: 'run',
          version: 1,
          runId,
          workerSource: WORKER_SOURCE,
          ...request,
        }
        iframe.contentWindow?.postMessage(run, '*') // opaque origin: '*' is the only option
      } else if (msg.type === 'result' && msg.runId === runId) {
        finish({ kind: 'result', result: msg })
      } else if (msg.type === 'fatal' && msg.runId === runId) {
        finish({ kind: 'fatal', message: msg.message })
      }
    }

    window.addEventListener('message', onMessage)
    document.body.appendChild(iframe)
  })
}
