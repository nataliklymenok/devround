---
id: node-http-server
module: node-web
order: 1
title: Building an HTTP server
description: The http module, routing and JSON with a framework, status codes and graceful shutdown.
levels: [junior, middle]
estimatedMinutes: 25
keyTakeaways:
  - Node's http module gives you raw request and response streams; frameworks add routing, parsing and validation.
  - Always validate input and return correct status codes and a consistent error format.
  - Read configuration from environment variables and validate it at startup.
  - Handle SIGTERM — stop accepting connections and close resources before exiting.
interviewQuestions:
  - question: What does a framework like Express or Fastify add on top of the http module?
    answer: |
      Routing by method and path, body parsing (JSON, forms), middleware or hooks, request validation
      and serialization, centralized error handling, logging and plugin ecosystems (cookies, CORS,
      rate limiting). Fastify also compiles JSON schemas for fast validation and serialization.
  - question: Which status codes would you return for create, validation error, unauthenticated and not found?
    answer: |
      `201 Created` (often with the new resource or a Location header), `400 Bad Request` for invalid
      input (some APIs use `422` for semantically invalid data), `401 Unauthorized` when credentials
      are missing or invalid (`403 Forbidden` when authenticated but not allowed), and
      `404 Not Found`. Server failures are `5xx`.
  - question: What is graceful shutdown and why does it matter?
    answer: |
      When the process receives `SIGTERM` (deploys, autoscaling), it should stop accepting new
      connections, let in-flight requests finish, close database pools and then exit. Without it,
      users get dropped connections and half-finished work during every deploy.
quiz:
  - id: q1
    question: Which status code fits a successful POST that created a resource?
    options: ["200", "201", "204", "302"]
    correct: 1
    explanation: 201 Created signals that a new resource was created.
  - id: q2
    question: A request has a valid session but the user may not access this resource. Which status?
    options: ["400", "401", "403", "500"]
    correct: 2
    explanation: 401 means not authenticated; 403 means authenticated but not allowed (or use 404 to hide existence).
  - id: q3
    question: Where should secrets like a database password come from?
    options: ["Hard-coded constants", "Environment variables or a secret manager", "A file committed to git", "Query parameters"]
    correct: 1
    explanation: Configuration and secrets belong in the environment, validated at startup.
---

## The bare http module

```js
import { createServer } from 'node:http'

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end(JSON.stringify({ ok: true }))
  }
  res.writeHead(404, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(3000)
```

Everything else — parsing bodies, routing, validation — you would have to build yourself.

## With a framework (Fastify)

```js
import Fastify from 'fastify'

const app = Fastify({ logger: true })

app.post(
  '/todos',
  {
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: { title: { type: 'string', minLength: 1 } },
      },
    },
  },
  async (request, reply) => {
    const todo = await db.todos.create({ title: request.body.title })
    return reply.status(201).send(todo)
  },
)

app.setErrorHandler((error, request, reply) => {
  request.log.error(error)
  const status = error.statusCode ?? 500
  reply.status(status).send({ error: status >= 500 ? 'Internal error' : error.message })
})

await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
```

## Configuration

```js
const port = Number(process.env.PORT ?? 3000)
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required') // fail fast at startup
```

Node can load a local file with `node --env-file=.env server.js`; never commit real secrets.

## Graceful shutdown

```js
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await app.close() // stop accepting connections, wait for in-flight requests
    await db.end() // close the connection pool
    process.exit(0)
  })
}
```
