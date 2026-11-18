---
id: ts-config
module: ts-in-practice
order: 3
title: tsconfig, strict mode and module resolution
description: What strict enables, the options worth turning on, module and moduleResolution choices, and type-checking in modern build setups.
levels: [junior, middle, senior]
estimatedMinutes: 20
topics: [ts-config]
references:
  - { title: 'TypeScript — TSConfig Reference', url: 'https://www.typescriptlang.org/tsconfig/' }
  - { title: 'TypeScript — Modules reference: module resolution', url: 'https://www.typescriptlang.org/docs/handbook/modules/reference.html' }
keyTakeaways:
  - strict turns on a family of checks (strictNullChecks, noImplicitAny, strictFunctionTypes, …) — enable it on day one.
  - noUncheckedIndexedAccess makes array and record access return T | undefined, catching real bugs.
  - Use moduleResolution bundler for Vite-style apps and NodeNext for Node packages.
  - Bundlers like Vite and esbuild strip types without checking — run tsc --noEmit (or vue-tsc etc.) in CI.
interviewQuestions:
  - question: What does strict mode enable?
    answer: |
      `strict: true` enables `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`,
      `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`,
      `useUnknownInCatchVariables` and future strict flags. The most important is `strictNullChecks`:
      without it `null` and `undefined` are assignable to every type.
  - question: How do you migrate a JavaScript project to TypeScript?
    answer: |
      Add a tsconfig with `allowJs` and `checkJs: false`, rename files to `.ts`/`.tsx` gradually
      starting from leaf modules and shared types, type the boundaries first (API responses, props),
      enable `strict` early (or per-folder with project references) and avoid blanket `any` — use
      `unknown` and narrow. Run `tsc --noEmit` in CI so errors cannot creep back.
  - question: Why does Vite not report type errors?
    answer: |
      Vite (via esbuild/Oxc) transpiles each file in isolation and simply removes types for speed; it
      never runs the type checker. That is why `isolatedModules` should be on (it forbids constructs
      that need whole-program information) and why `tsc --noEmit` runs separately in the editor and CI.
quiz:
  - id: q1
    question: "With noUncheckedIndexedAccess, what is the type of arr[0] for arr: string[]?"
    options: ["string", "string | undefined", "any", "never"]
    correct: 1
    explanation: Indexed access may be out of bounds, so undefined is included.
  - id: q2
    question: Which moduleResolution fits an app bundled by Vite?
    options: ["node10", "bundler", "classic", "NodeNext"]
    correct: 1
    explanation: bundler models how modern bundlers resolve imports.
  - id: q3
    question: Without strictNullChecks, what happens?
    options: ["null is assignable to every type", "TypeScript refuses to compile", "undefined becomes a type error everywhere", "Nothing changes"]
    correct: 0
    explanation: That is exactly the class of bugs strict null checks prevent.
---

## A solid baseline

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

## Module settings

| Project | module | moduleResolution |
| --- | --- | --- |
| App built by Vite/webpack | `ESNext` | `bundler` |
| Node ESM package or server | `NodeNext` | `NodeNext` (requires `.js` extensions in relative imports) |
| Library for many consumers | `NodeNext` + `exports` map | `NodeNext` |

## Type-checking in the pipeline

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build"
  }
}
```

For monorepos, project references (`composite`, `references`) let `tsc -b` check packages
incrementally.
