---
id: react-component-patterns
module: react-core
order: 6
title: Component patterns and anti-patterns
description: Composition and children, compound components, higher-order components, render props, container vs presentational, one-way data flow and Flux, and common React anti-patterns.
levels: [middle, senior]
estimatedMinutes: 30
topics: [react-patterns]
references:
  - { title: 'React — Passing JSX as children', url: 'https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children' }
  - { title: 'React — Reusing logic with custom hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks' }
  - { title: 'React — You might not need an effect', url: 'https://react.dev/learn/you-might-not-need-an-effect' }
  - { title: 'patterns.dev — React patterns', url: 'https://www.patterns.dev/react' }
keyTakeaways:
  - Composition through children and props is React's main reuse tool — prefer it to inheritance and deep prop lists.
  - HOCs and render props share logic between components; custom hooks replaced most of them, but you will meet both in existing code.
  - Data flows down through props, changes flow up through callbacks — Flux and Redux apply the same one-way idea to app state.
  - 'Classic anti-patterns: copying props into state, deriving state in effects, components defined inside components, index keys in dynamic lists, mutating state.'
interviewQuestions:
  - question: What is the composition pattern in React?
    answer: |
      Building components by putting other components inside them instead of extending classes.
      A `Card` accepts `children` (or named slots like `header` and `footer` props) so the caller
      decides the content; a `Dialog` is a generic `Modal` with specific children. Composition also
      fixes prop drilling in many cases: pass the ready element down (`<Layout sidebar={<UserMenu
      user={user} />}>`) instead of passing `user` through every level.
  - question: What are higher-order components and render props, and why are they less common now?
    answer: |
      A higher-order component is a function that takes a component and returns a new one with extra
      props or behavior — `withRouter(Component)`, `connect(mapState)(Component)`. A render prop is a
      prop that is a function returning JSX — `<Mouse render={(pos) => <Cursor {...pos} />} />` — so
      the component shares its state with whatever the caller renders. Both share stateful logic, but
      they add wrapper layers ("wrapper hell"), can clash on prop names (HOCs) and make data flow
      harder to follow. Custom hooks share the same logic without changing the component tree, so new
      code uses hooks; HOCs remain useful for cross-cutting wrappers such as error boundaries or auth
      gates.
  - question: What are compound components?
    answer: |
      A set of components that work together and share implicit state through context, giving the
      caller control over markup: `<Tabs><Tabs.List><Tabs.Tab /></Tabs.List><Tabs.Panel /></Tabs>`.
      The parent owns the state (active tab) and provides it via context; the children read it. It
      avoids huge configuration props like `tabs={[{ label, content, disabled }]}` and is how libraries
      such as Radix and Headless UI are designed.
  - question: Explain one-way data flow and the Flux pattern.
    answer: |
      In React, data flows from parent to child through props; a child cannot change the parent's
      data directly — it calls a callback, the owner updates its state, and the new data flows down.
      This makes it clear who owns each piece of state. Flux applies the same idea to app-wide state:
      views dispatch actions → a dispatcher → stores update → views re-render. Redux is a simplified
      Flux with one store and pure reducers. The benefit is predictable, traceable updates; the cost
      is more boilerplate than two-way binding.
  - question: What are some common React anti-patterns?
    answer: |
      Copying props into state (it goes stale — derive values during render instead); using
      `useEffect` to compute derived data or to react to events (do it in the render or the event
      handler); defining a component inside another component (it gets a new identity every render
      and loses its state); using array indices as keys in lists that reorder; mutating state or props;
      one giant context for everything (every consumer re-renders); prop drilling through many levels
      instead of composition or context; and premature `useMemo`/`useCallback` everywhere.
  - question: What is the container vs presentational component pattern?
    answer: |
      Container components handle data and behavior (fetching, state, side effects); presentational
      components only receive props and render UI, which makes them easy to reuse, test and show in
      Storybook. With hooks the split is usually a custom hook (`useUserList`) plus a presentational
      component, rather than two components — but the idea of separating data from display still
      holds.
quiz:
  - id: q1
    question: What does a higher-order component take and return?
    options: ["A hook, returns state", "A component, returns a new component", "JSX, returns a string", "Props, returns JSX"]
    correct: 1
    explanation: withX(Component) returns an enhanced component.
  - id: q2
    question: What mostly replaced HOCs and render props for sharing stateful logic?
    options: ["Class inheritance", "Custom hooks", "Context only", "Portals"]
    correct: 1
    explanation: Hooks share logic without adding wrapper components.
  - id: q3
    question: "Why is defining `function Row() {}` inside a parent component's body a problem?"
    options: ["It is a syntax error", "Row gets a new identity each render, so React remounts it and loses its state", "Hooks cannot be used in it", "It cannot receive props"]
    correct: 1
    explanation: A new component type on every render means unmount and remount.
  - id: q4
    question: How does a child change data owned by its parent?
    options: ["By mutating props", "By calling a callback the parent passed down", "By using refs on the parent", "It cannot"]
    correct: 1
    explanation: Changes flow up through callbacks; data flows down through props.
---

## Composition with children and slots

```jsx
function Card({ title, actions, children }) {
  return (
    <section className="card">
      <header>{title}{actions}</header>
      {children}
    </section>
  )
}

<Card title="Profile" actions={<EditButton />}>
  <ProfileForm />
</Card>
```

Passing ready-made elements down avoids drilling the data they need through intermediate layers.

## Compound components

```jsx
const TabsContext = createContext(null)

function Tabs({ defaultValue, children }) {
  const [active, setActive] = useState(defaultValue)
  return <TabsContext value={{ active, setActive }}>{children}</TabsContext>
}
function Tab({ value, children }) {
  const { active, setActive } = use(TabsContext)
  return (
    <button role="tab" aria-selected={active === value} onClick={() => setActive(value)}>
      {children}
    </button>
  )
}
function Panel({ value, children }) {
  const { active } = use(TabsContext)
  return active === value ? <div role="tabpanel">{children}</div> : null
}
Tabs.Tab = Tab
Tabs.Panel = Panel
```

(React 19 lets you render `<TabsContext>` as a provider and read it with `use`; in React 18 use
`<TabsContext.Provider>` and `useContext`.) The `react-accessible-tabs` coding task builds the
keyboard behavior on top of this.

## HOC, render prop, hook — the same logic three ways

```jsx
// higher-order component
function withWindowWidth(Component) {
  return function WithWindowWidth(props) {
    const width = useWindowWidth()
    return <Component {...props} width={width} />
  }
}

// render prop
function WindowWidth({ children }) {
  return children(useWindowWidth())
}
<WindowWidth>{(width) => <Layout compact={width < 600} />}</WindowWidth>

// custom hook — no extra components in the tree
function Layout() {
  const width = useWindowWidth()
  return <Grid compact={width < 600} />
}
```

## One-way data flow

```text
state (owner) ──props──▶ child ──callback(onChange)──▶ owner updates state ──▶ re-render
Flux:   view ──action──▶ dispatcher ──▶ store ──▶ view
Redux:  view ──dispatch(action)──▶ reducer(state, action) ──▶ new state ──▶ subscribed views
```

## Anti-patterns to recognize

```jsx
// ❌ copying a prop into state — ignores later prop changes
const [name, setName] = useState(props.name)

// ❌ derived data in an effect — an extra render with stale data first
useEffect(() => setFullName(`${first} ${last}`), [first, last])
// ✅ derive during render
const fullName = `${first} ${last}`

// ❌ component defined inside a component — remounts every render
function List({ items }) {
  function Row({ item }) { return <li>{item.name}</li> }
  return items.map((item) => <Row key={item.id} item={item} />)
}
```

To reset a child's state when an input changes, give it a `key` (`<Profile key={userId} />`)
instead of syncing state with effects.
