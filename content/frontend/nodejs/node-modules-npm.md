---
id: node-modules-npm
module: node-runtime
order: 2
title: Modules and npm
description: CommonJS vs ES modules in Node, package.json fields, semver and lockfiles.
levels: [junior, middle]
estimatedMinutes: 20
reviewed: 2026-11-20
keyTakeaways:
  - Node supports CommonJS (require) and ES modules (import); "type" in package.json picks the default for .js files.
  - ES modules need file extensions in relative imports and have no __dirname — use import.meta.dirname.
  - Semver ranges (^, ~) decide which versions npm may install; the lockfile pins exact versions.
  - Use npm ci in CI for reproducible installs and keep dependencies and devDependencies separate.
interviewQuestions:
  - question: What is the difference between CommonJS and ES modules in Node?
    answer: |
      CommonJS uses `require()` and `module.exports`, loads synchronously and is the legacy default.
      ES modules use `import`/`export`, are statically analyzable, support top-level `await` and are
      the standard. In Node a file is ESM if it ends in `.mjs`, or ends in `.js` with
      `"type": "module"` in the nearest package.json.
  - question: What do ^1.4.2 and ~1.4.2 mean in package.json?
    answer: |
      `^1.4.2` allows any version below 2.0.0 that is at least 1.4.2 — new minor and patch releases.
      `~1.4.2` allows only patch releases below 1.5.0. Exact versions are installed according to the
      lockfile; the range matters when the lockfile is created or updated.
  - question: Why commit package-lock.json, and what is npm ci?
    answer: |
      The lockfile records the exact resolved version of every dependency, so every machine and CI run
      installs the same tree. `npm ci` installs strictly from the lockfile, fails if it is out of sync
      with package.json and starts from a clean `node_modules` — fast and reproducible.
quiz:
  - id: q1
    question: "Which package.json field makes .js files ES modules?"
    options: ["\"module\": true", "\"type\": \"module\"", "\"esm\": true", "\"exports\": \"esm\""]
    correct: 1
    explanation: '"type": "module" sets the default module system for .js files in that package.'
  - id: q2
    question: "Which versions does ^2.3.1 allow?"
    options: ["Only 2.3.1", "2.3.x only", ">= 2.3.1 and < 3.0.0", "Any version"]
    correct: 2
    explanation: The caret allows minor and patch updates within the same major version.
  - id: q3
    question: Which command should CI use to install dependencies?
    options: ["npm install", "npm update", "npm ci", "npm audit fix"]
    correct: 2
    explanation: npm ci installs exactly what the lockfile says and fails if it is out of date.
topics: [node-modules, node-npm-semver]
references:
  - { title: 'Node.js — Modules: Packages', url: 'https://nodejs.org/api/packages.html' }
  - { title: 'npm Docs — About semantic versioning', url: 'https://docs.npmjs.com/about-semantic-versioning' }
---

## CommonJS vs ES modules

```js
// CommonJS (math.cjs)
const path = require('node:path')
module.exports = { add: (a, b) => a + b }

// ES module (math.js with "type": "module")
import path from 'node:path'
export const add = (a, b) => a + b
```

In ES modules:

- relative imports need the extension: `import { add } from './math.js'`
- `__dirname` and `__filename` do not exist — use `import.meta.dirname` and `import.meta.filename`
- top-level `await` works

## package.json essentials

```json
{
  "name": "orders-api",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": { "start": "node src/server.js", "test": "node --test" },
  "dependencies": { "fastify": "^5.0.0" },
  "devDependencies": { "typescript": "^5.6.0" }
}
```

`dependencies` are needed at runtime; `devDependencies` only for building and testing.

## Semver

```text
MAJOR.MINOR.PATCH  →  breaking.feature.fix
^1.4.2  → >=1.4.2 <2.0.0
~1.4.2  → >=1.4.2 <1.5.0
1.4.2   → exactly 1.4.2
```

## Reproducible installs

```bash
npm install fastify      # adds the dependency and updates package-lock.json
npm ci                   # CI: clean install exactly from the lockfile
npm outdated             # what can be upgraded
npm audit                # known vulnerabilities in the tree
```
