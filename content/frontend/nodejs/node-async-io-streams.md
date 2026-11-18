---
id: node-async-io-streams
module: node-runtime
order: 3
title: Async I/O and streams
description: Promises-based fs, streams, backpressure and processing large data without running out of memory.
levels: [middle, senior]
estimatedMinutes: 25
keyTakeaways:
  - Use the promise APIs (fs/promises) and await them; avoid sync APIs in request handlers.
  - Streams process data in chunks, so memory stays flat regardless of input size.
  - Backpressure slows a fast producer down when the consumer cannot keep up.
  - Use stream.pipeline (promise version) to connect streams and propagate errors and cleanup.
interviewQuestions:
  - question: When would you use streams instead of reading a whole file?
    answer: |
      When data is large or unbounded — big files, uploads, CSV exports, proxying responses. Reading a
      2 GB file with `readFile` loads it all into memory; a stream processes it chunk by chunk with
      roughly constant memory and starts producing output immediately.
  - question: What is backpressure?
    answer: |
      When a writable stream cannot consume data as fast as the readable side produces it, `write()`
      returns `false` and the producer should pause until `drain`. `pipe` and `pipeline` handle this
      automatically. Ignoring it buffers data in memory until the process runs out of memory.
  - question: Why prefer pipeline over pipe?
    answer: |
      `readable.pipe(writable)` does not forward errors or destroy the other streams when one fails,
      which can leak file descriptors. `pipeline` (and its promise version from `node:stream/promises`)
      wires all streams together, propagates the first error and cleans everything up.
quiz:
  - id: q1
    question: You need to gzip a 5 GB log file. What is the best approach?
    options: ["readFile then zlib.gzipSync", "A read stream → gzip stream → write stream with pipeline", "Load it line by line into an array first", "Spawn 5 workers that each read 1 GB with readFile"]
    correct: 1
    explanation: Streaming keeps memory usage flat; pipeline handles backpressure and errors.
  - id: q2
    question: What does writable.write() returning false mean?
    options: ["The write failed", "The internal buffer is full — wait for 'drain'", "The stream is closed", "The data was discarded"]
    correct: 1
    explanation: It is the backpressure signal; continuing to write grows memory usage.
  - id: q3
    question: What is a problem with readable.pipe(writable)?
    options: ["It is synchronous", "It does not propagate errors or clean up the other stream", "It cannot handle binary data", "It ignores backpressure"]
    correct: 1
    explanation: pipe handles backpressure but not error propagation — pipeline does both.
topics: [node-streams]
references:
  - { title: 'Node.js — Stream', url: 'https://nodejs.org/api/stream.html' }
  - { title: 'Node.js — Backpressuring in Streams', url: 'https://nodejs.org/en/learn/modules/backpressuring-in-streams' }
---

## Promise-based I/O

```js
import { readFile, writeFile } from 'node:fs/promises'

const config = JSON.parse(await readFile(new URL('./config.json', import.meta.url), 'utf8'))
await writeFile('out.json', JSON.stringify(config, null, 2))
```

## Streams for large data

```js
import { createReadStream, createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'

await pipeline(
  createReadStream('access.log'),
  createGzip(),
  createWriteStream('access.log.gz'),
) // flat memory usage, errors propagate, all streams are closed on failure
```

## Processing line by line

```js
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const lines = createInterface({ input: createReadStream('users.csv'), crlfDelay: Infinity })
let count = 0
for await (const line of lines) {
  if (line.includes('@example.com')) count++
}
```

## Streaming an HTTP response

```js
import { createReadStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'

server.on('request', async (req, res) => {
  res.setHeader('content-type', 'text/csv')
  try {
    await pipeline(createReadStream('report.csv'), res)
  } catch (error) {
    req.log?.error(error) // client disconnected or file error — streams already cleaned up
  }
})
```

## Senior angle: backpressure by hand

```js
function writeMany(stream, rows) {
  return new Promise((resolve) => {
    let i = 0
    const writeNext = () => {
      while (i < rows.length) {
        if (!stream.write(rows[i++] + '\n')) return stream.once('drain', writeNext)
      }
      resolve()
    }
    writeNext()
  })
}
```
