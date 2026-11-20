---
id: ts-declarations
module: ts-in-practice
order: 4
title: Declaration files and module augmentation
description: What .d.ts files are, typing untyped packages, global declarations and augmenting third-party types.
levels: [middle, senior]
estimatedMinutes: 20
topics: [ts-declarations]
reviewed: 2026-11-20
references:
  - { title: 'TypeScript Handbook — Declaration Files: Introduction', url: 'https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html' }
  - { title: 'TypeScript Handbook — Declaration Merging (module augmentation)', url: 'https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation' }
keyTakeaways:
  - .d.ts files contain only types and describe JavaScript that exists elsewhere.
  - Types for untyped packages come from DefinitelyTyped (@types/...) or a local declare module.
  - Module augmentation adds members to existing modules' interfaces (Express Request, Fastify, styled-components theme).
  - Global augmentations need declare global inside a module file.
interviewQuestions:
  - question: How do you use a JavaScript package that has no types?
    answer: |
      First look for `@types/package-name`. If none exists, add a declaration file such as
      `src/types/legacy-lib.d.ts` with `declare module 'legacy-lib' { export function format(x:
      string): string }` describing only what you use. As a last resort `declare module
      'legacy-lib'` makes everything `any`, which should be temporary.
  - question: What is module augmentation and when have you used it?
    answer: |
      Reopening a module's declarations to add members, relying on interface merging: e.g.
      `declare module 'fastify' { interface FastifyRequest { user: User | null } }` after a plugin
      decorates the request, or adding fields to a router's route meta type or a CSS-in-JS theme type.
      The file must be a module (have an import or export) for `declare module` to augment rather than
      replace.
  - question: How do you type a global such as window.analytics?
    answer: |
      In a module file: `declare global { interface Window { analytics?: Analytics } }` and add
      `export {}` if the file has no other exports. Prefer passing dependencies explicitly over relying
      on globals.
quiz:
  - id: q1
    question: What does a .d.ts file contain?
    options: ["Compiled JavaScript", "Only type declarations", "Test cases", "CSS types only"]
    correct: 1
    explanation: Declaration files have no runtime code.
  - id: q2
    question: Where do community types for untyped npm packages usually live?
    options: ["@types scoped packages from DefinitelyTyped", "Inside node_modules/.bin", "In tsconfig.json", "In package-lock.json"]
    correct: 0
    explanation: "@types/... packages are published from DefinitelyTyped."
  - id: q3
    question: Why must an augmentation file contain an import or export?
    options: ["For tree shaking", "So declare module augments the existing module instead of declaring a new ambient one", "It does not need one", "To run at startup"]
    correct: 1
    explanation: Inside a module, declare module 'x' is an augmentation.
---

## Typing an untyped package

```ts
// src/types/legacy-lib.d.ts
declare module 'legacy-lib' {
  export interface FormatOptions {
    locale?: string
  }
  export function format(value: number, options?: FormatOptions): string
}
```

## Module augmentation

```ts
// src/types/fastify.d.ts
import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string; role: 'admin' | 'user' } | null
  }
}
```

## Global augmentation

```ts
// src/types/global.d.ts
export {}

declare global {
  interface Window {
    __APP_VERSION__: string
  }
}
```

## Assets and environment variables

```ts
// vite-env.d.ts (Vite ships most of these in vite/client)
declare module '*.svg' {
  const src: string
  export default src
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}
```
