# Code Runner Contract (browser)

**Research**: R4, R5 | **Spec**: FR-015, FR-015a, SC-007

## Isolation

```text
App page (our origin, has session cookie)
 └─ <iframe sandbox="allow-scripts" srcdoc="…">   ← opaque origin, CSP: default-src 'none';
     │                                               script-src 'unsafe-inline' blob:; worker-src blob:
     └─ Web Worker (blob:)                         ← runs harness + user code
```

- No `allow-same-origin` → no cookies, storage, IndexedDB or parent DOM access.
- CSP `default-src 'none'` → `fetch`, XHR, WebSocket, `importScripts` from the network are blocked.
- One fresh iframe per run; removed after the run or on timeout (terminates the worker).
- Total time limit: **5000 ms** per run (configurable constant); console capture capped at
  100 lines × 500 chars; result payload capped at 256 KB.

## Messages (all validated with Zod on receipt; anything else is ignored)

App → iframe (`postMessage(msg, '*')`; the iframe has an opaque origin):

```ts
{ type: 'run', version: 1, runId: string, code: string, entry: string,
  tests: { name: string; code: string }[], perCaseTimeoutMs: number }
```

iframe → app (app checks `event.source === iframe.contentWindow`):

```ts
{ type: 'ready', version: 1 }
{ type: 'result', version: 1, runId: string,
  cases: { name: string; status: 'passed' | 'failed' | 'error';
           message?: string; expected?: string; actual?: string; durationMs: number }[],
  console: string[], totalMs: number }
{ type: 'fatal', version: 1, runId: string, message: string }   // e.g. syntax error in user code
```

App-side outcomes shown to the user: `passed n/N`, per-case details, `Timed out after 5 s`,
`Syntax error: …`, `Checks can't run in this browser` (iframe/worker creation failed — spec edge
case).

## Harness semantics (shared with `content:validate`)

- Per case: fresh evaluation of user code + case code inside an async function; globals available:
  `assert`, `clock`, `console`, the user's `entry` function.
- Fake timers: `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, `Date.now`,
  `performance.now` are virtual; `clock.tick(ms)` advances and runs due timers in order;
  `await clock.tickAsync(ms)` also flushes promise microtasks between timers.
- Failing assertion → `failed` with `expected`/`actual` (serialized, ≤ 1 KB each); thrown
  non-assertion error → `error`; per-case timeout (`perCaseTimeoutMs`, default 1000) → `error`.
