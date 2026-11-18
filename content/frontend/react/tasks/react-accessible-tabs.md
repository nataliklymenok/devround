---
id: react-accessible-tabs
order: 1
title: Build accessible tabs
levels: [junior, middle, senior]
difficulty: medium
estimatedMinutes: 40
mode: self-check
topics: [react-state-props, react-refs-portals]
references:
  - { title: 'W3C APG — Tabs pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' }
  - { title: 'React — Manipulating the DOM with Refs', url: 'https://react.dev/learn/manipulating-the-dom-with-refs' }
hints:
  - Follow the APG tabs pattern — role tablist, tab and tabpanel, with aria-selected and aria-controls.
  - Use a roving tabindex — only the selected tab has tabIndex 0, others -1.
  - Handle ArrowLeft, ArrowRight, Home and End on the tab list and move focus with refs.
starterCode: |
  // tabs: { id: string; label: string; content: React.ReactNode }[]
  export function Tabs({ tabs }) {
    return null
  }
acceptanceCriteria:
  - Clicking a tab shows its panel and hides the others
  - The tabs have role="tab" inside role="tablist", the selected one has aria-selected="true"
  - Each tab is linked to its panel (aria-controls / aria-labelledby)
  - Only the selected tab is in the Tab order; Tab from it moves into the panel
  - ArrowLeft/ArrowRight move focus and selection between tabs, wrapping around; Home/End go to the first/last tab
  - Works with any number of tabs and does not break when tabs change
---

## Problem

Build a `Tabs` component that receives `tabs` (id, label, content) and renders an accessible tab
interface following the WAI-ARIA Authoring Practices.

## Constraints

- Function component with hooks, no UI library.
- Automatic activation: moving focus with the arrow keys also selects the tab.

## Examples

```jsx
<Tabs
  tabs={[
    { id: 'overview', label: 'Overview', content: <p>…</p> },
    { id: 'specs', label: 'Specs', content: <SpecsTable /> },
  ]}
/>
```

## Solution

```jsx
import { useId, useRef, useState } from 'react'

export function Tabs({ tabs }) {
  const [selected, setSelected] = useState(0)
  const tabRefs = useRef([])
  const baseId = useId()
  const current = Math.min(selected, tabs.length - 1)

  function select(index) {
    setSelected(index)
    tabRefs.current[index]?.focus()
  }

  function onKeyDown(event) {
    const last = tabs.length - 1
    const next = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next)
  }

  return (
    <div>
      <div role="tablist" aria-label="Sections" onKeyDown={onKeyDown}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[index] = el)}
            role="tab"
            type="button"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={index === current}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={index === current ? 0 : -1}
            onClick={() => select(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={index !== current}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
```

## Explanation

State holds only the selected index; everything else is derived. A roving `tabIndex` makes the tab
list a single Tab stop, as the pattern requires, and arrow keys move between tabs. Refs let us move
focus to the newly selected tab. `useId` produces unique ids so several `Tabs` instances can coexist,
and `aria-controls` / `aria-labelledby` connect tabs and panels for screen readers. Clamping the index
(`current`) keeps the component working if the `tabs` prop shrinks.

## Common mistakes

- Using links or divs without roles — screen readers do not announce a tab interface.
- Making every tab focusable with Tab instead of using arrow keys.
- Rendering only the active panel without ids, so `aria-controls` points nowhere (rendering only the
  active panel is fine if the ids still match).
- Forgetting `type="button"`, which submits enclosing forms.
