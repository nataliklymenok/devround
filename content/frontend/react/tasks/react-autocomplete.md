---
id: react-autocomplete
order: 2
title: Build an autocomplete input
levels: [middle, senior]
difficulty: hard
estimatedMinutes: 60
mode: self-check
topics: [react-effects, react-forms]
references:
  - { title: 'W3C APG — Combobox pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/' }
  - { title: 'React — Synchronizing with Effects (fetching data)', url: 'https://react.dev/learn/synchronizing-with-effects#fetching-data' }
  - { title: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' }
hints:
  - Debounce the query (e.g. 300 ms) before fetching, and skip empty queries.
  - Abort the previous request in the effect cleanup so a slow old response can never overwrite a newer one.
  - Keep an activeIndex for keyboard navigation and use the combobox pattern (role="combobox", aria-expanded, aria-activedescendant, role="listbox"/"option").
starterCode: |
  // search(query, { signal }) → Promise<{ id: string; label: string }[]>
  export function Autocomplete({ search, onSelect }) {
    return null
  }
acceptanceCriteria:
  - Requests start only after the user pauses typing (debounced) and not for an empty query
  - Results of an older query never replace results of a newer one (stale requests are aborted or ignored)
  - Loading, empty ("No results") and error states are shown
  - ArrowDown/ArrowUp move the highlighted option, Enter selects it, Escape closes the list
  - Clicking an option selects it and fills the input
  - The input uses role="combobox" with aria-expanded, aria-controls and aria-activedescendant; options have role="option" and aria-selected
---

## Problem

Build an `Autocomplete` component that calls `search(query, { signal })` while the user types and
shows suggestions in a list that can be used with mouse and keyboard.

## Constraints

- No libraries for the combobox; `search` is provided.
- Must not show results for an outdated query.

## Examples

```jsx
<Autocomplete search={searchCities} onSelect={(city) => setCity(city)} />
```

## Solution

```jsx
import { useEffect, useId, useState } from 'react'

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function Autocomplete({ search, onSelect }) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const debounced = useDebounced(query.trim(), 300)

  useEffect(() => {
    if (!debounced) {
      setResults([])
      setStatus('idle')
      return
    }
    const controller = new AbortController()
    setStatus('loading')
    search(debounced, { signal: controller.signal })
      .then((items) => {
        setResults(items)
        setActive(-1)
        setStatus('done')
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setStatus('error')
      })
    return () => controller.abort() // a newer query cancels the older request
  }, [debounced, search])

  function choose(item) {
    setQuery(item.label)
    setOpen(false)
    onSelect(item)
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && open && results[active]) {
      event.preventDefault()
      choose(results[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const expanded = open && debounced !== ''
  return (
    <div>
      <input
        role="combobox"
        aria-label="Search"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
      />
      {expanded && (
        <ul id={listId} role="listbox">
          {status === 'loading' && <li role="presentation">Loading…</li>}
          {status === 'error' && <li role="presentation">Something went wrong</li>}
          {status === 'done' && results.length === 0 && <li role="presentation">No results</li>}
          {results.map((item, index) => (
            <li
              key={item.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(e) => e.preventDefault()} // keep focus in the input
              onClick={() => choose(item)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

## Explanation

Debouncing the query reduces requests; the effect depends on the debounced value, and its cleanup
aborts the previous request, so out-of-order responses cannot overwrite newer results (the classic
race condition). Status is a single field instead of several booleans. Keyboard support and
`aria-activedescendant` let screen-reader users hear the highlighted option while focus stays in the
input, as the combobox pattern requires.

## Common mistakes

- Fetching on every keystroke without debounce.
- Not aborting or ignoring stale responses — results "jump back" to an older query.
- Moving DOM focus into the list, which breaks typing.
- Losing the click because the input blur closes the list before the option's click fires
  (`onMouseDown` + `preventDefault` avoids it).
- Interview follow-ups: caching results per query, highlighting the matched text, IME composition.
