---
id: ts-typing-react
module: ts-advanced-types
order: 3
title: Typing React components
description: Props, children, events, hooks and generic components with TypeScript.
levels: [junior, middle, senior]
estimatedMinutes: 25
keyTakeaways:
  - Type props with an interface or type and destructure them in the parameter list.
  - Use ReactNode for children and the specific event types for handlers.
  - Let useState infer when it can; pass a type argument for unions and null initial values.
  - Generic components keep the item type flowing through props and callbacks.
interviewQuestions:
  - question: How do you type a component's props and children?
    answer: |
      Declare the props type and annotate the parameter: `function Card({ title, children }: CardProps)`.
      Use `children: ReactNode` for anything renderable. Avoid `React.FC` in new code — it adds little
      and used to add implicit children; a plain function with typed props is clearer.
  - question: How do you type event handlers?
    answer: |
      Use React's event types with the element type: `React.ChangeEvent<HTMLInputElement>`,
      `React.FormEvent<HTMLFormElement>`, `React.MouseEvent<HTMLButtonElement>`. When the handler is
      written inline, the type is inferred from the JSX attribute.
  - question: How do you type useState with an initial null value?
    answer: |
      Provide the type argument: `useState<User | null>(null)`. Without it TypeScript infers `null`
      and you could never set a user. For a non-null initial value, inference is enough.
  - question: How would you build a generic List component?
    answer: |
      Make the component generic: `function List<T>({ items, renderItem }: { items: T[];
      renderItem: (item: T) => ReactNode })`. The item type is inferred from `items`, so `renderItem`
      gets the correct type with no casts.
quiz:
  - id: q1
    question: Which type should a children prop that accepts any renderable content have?
    options: ["JSX.Element", "ReactNode", "string", "ReactElement[]"]
    correct: 1
    explanation: ReactNode covers elements, strings, numbers, arrays, null and more.
  - id: q2
    question: "How do you type an onChange handler for an input element?"
    options: ["(e: Event) => void", "(e: React.ChangeEvent<HTMLInputElement>) => void", "(e: InputEvent) => void", "(value: string) => void"]
    correct: 1
    explanation: React wraps native events; use ChangeEvent with the element type.
  - id: q3
    question: "What does useState(null) infer without a type argument?"
    options: ["any", "null", "unknown", "undefined"]
    correct: 1
    explanation: The state type is just null — pass useState<User | null>(null) instead.
topics: [ts-react-typing]
references:
  - { title: 'React — Using TypeScript', url: 'https://react.dev/learn/typescript' }
---

## Props and children

```tsx
import type { ReactNode } from 'react'

interface CardProps {
  title: string
  variant?: 'plain' | 'highlighted'
  children: ReactNode
}

export function Card({ title, variant = 'plain', children }: CardProps) {
  return (
    <section data-variant={variant}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}
```

## Events

```tsx
function SearchBox({ onSearch }: { onSearch: (query: string) => void }) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onSearch(String(data.get('q') ?? ''))
  }
  return (
    <form onSubmit={handleSubmit}>
      <input name="q" onChange={(e) => console.log(e.target.value)} />
    </form>
  )
}
```

## Hooks

```tsx
const [user, setUser] = useState<User | null>(null)
const [count, setCount] = useState(0) // inferred number
const inputRef = useRef<HTMLInputElement>(null)

type Action = { type: 'add'; item: string } | { type: 'clear' }
function reducer(state: string[], action: Action): string[] {
  return action.type === 'add' ? [...state, action.item] : []
}
```

## Generic components

```tsx
interface ListProps<T> {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
}

export function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  return <ul>{items.map((item) => <li key={getKey(item)}>{renderItem(item)}</li>)}</ul>
}

// T is inferred as User — renderItem's parameter is typed automatically
<List items={users} getKey={(u) => u.id} renderItem={(u) => u.name} />
```
