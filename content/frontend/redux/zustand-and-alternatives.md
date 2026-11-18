---
id: zustand-and-alternatives
module: state-advanced
order: 3
title: Zustand and other alternatives
description: Zustand stores and selectors, atom-based state, and how to compare state libraries in an interview.
levels: [junior, middle]
estimatedMinutes: 20
topics: [state-alternatives]
references:
  - { title: 'Zustand — Documentation', url: 'https://zustand.docs.pmnd.rs/' }
  - { title: 'Jotai — Documentation', url: 'https://jotai.org/docs/introduction' }
keyTakeaways:
  - Zustand is a small store with a hook API — no providers or reducers required; select slices to avoid re-renders.
  - Atom-based libraries (Jotai, Recoil-style) build state from small independent pieces.
  - Compare libraries by boilerplate, DevTools, middleware, TypeScript support, SSR story and team familiarity.
  - The library matters less than separating server state from client state and keeping state minimal.
interviewQuestions:
  - question: How does Zustand differ from Redux Toolkit?
    answer: |
      Zustand creates a store with `create((set, get) => ({...}))` and gives you a hook; actions are just
      functions in the store, there is no provider, no action objects and much less boilerplate.
      Redux Toolkit is more structured — actions, reducers, middleware, strong DevTools and conventions
      for large teams. Zustand suits small and medium apps or local feature stores; Redux shines when
      many developers need a strict, traceable pattern.
  - question: How do you avoid unnecessary re-renders with Zustand?
    answer: |
      Select only what the component needs: `const count = useCartStore((s) => s.count)`. Selecting
      the whole store re-renders on every change. When selecting several values as an object or array,
      use `useShallow` so a new object with the same contents does not trigger a render.
  - question: What is the idea behind atom-based state?
    answer: |
      State is split into atoms — small independent units — and derived atoms compute from others.
      Components subscribe to exactly the atoms they use, so updates are fine-grained. It fits apps with
      many independent pieces of state (editors, dashboards with widgets) and avoids one big store.
quiz:
  - id: q1
    question: Does Zustand require wrapping the app in a Provider?
    options: ["Yes, always", "No, the store is used through a hook", "Only in production", "Only with TypeScript"]
    correct: 1
    explanation: Zustand stores are module-level hooks (providers are optional for SSR or scoping).
  - id: q2
    question: "useCartStore() with no selector — what happens on any store update?"
    options: ["Nothing", "The component re-renders", "It throws", "Only actions update"]
    correct: 1
    explanation: Without a selector the whole state is selected.
  - id: q3
    question: Which factor matters most when choosing a state library?
    options: ["GitHub stars", "Fit for the kind of state, team conventions and tooling", "Bundle size only", "Whether it uses classes"]
    correct: 1
    explanation: Trade-offs depend on the app and the team.
---

## A Zustand store

```ts
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

interface CartState {
  items: Record<string, number>
  add: (id: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>()((set) => ({
  items: {},
  add: (id) => set((s) => ({ items: { ...s.items, [id]: (s.items[id] ?? 0) + 1 } })),
  clear: () => set({ items: {} }),
}))

// Components select what they need
const count = useCartStore((s) => Object.values(s.items).reduce((a, b) => a + b, 0))
const { add, clear } = useCartStore(useShallow((s) => ({ add: s.add, clear: s.clear })))
```

Middleware such as `persist`, `devtools` and `immer` add persistence, Redux DevTools and draft
updates.

## Atoms (Jotai)

```ts
import { atom, useAtom, useAtomValue } from 'jotai'

const priceAtom = atom(100)
const qtyAtom = atom(2)
const totalAtom = atom((get) => get(priceAtom) * get(qtyAtom)) // derived

function Total() {
  const total = useAtomValue(totalAtom)
  return <p>Total: {total}</p>
}
```

## Comparing in an interview

| | Redux Toolkit | Zustand | Jotai | Context |
| --- | --- | --- | --- | --- |
| Boilerplate | Medium | Low | Low | Low |
| DevTools | Excellent | Via middleware | Via extension | None |
| Re-render control | Selectors | Selectors | Per atom | All consumers |
| Best for | Large teams, complex flows | Small–medium shared state | Fine-grained independent state | Rarely changing values |
