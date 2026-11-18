---
id: react-modal-focus-trap
order: 4
title: Build a modal dialog with focus management
levels: [middle, senior]
difficulty: medium
estimatedMinutes: 40
mode: self-check
topics: [react-refs-portals, react-effects]
references:
  - { title: 'MDN — dialog element', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog' }
  - { title: 'W3C APG — Dialog (Modal) pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/' }
hints:
  - The native dialog element with showModal() gives you a focus trap, Escape handling, a backdrop and an inert background.
  - Sync the open prop to showModal()/close() in an effect, and call onClose from the dialog's close event.
  - Remember the element that had focus before opening and restore focus to it on close.
starterCode: |
  export function Modal({ open, title, onClose, children }) {
    return null
  }
acceptanceCriteria:
  - When opened, focus moves into the dialog; Tab and Shift+Tab stay inside it
  - Escape and a close button close the dialog and call onClose
  - When closed, focus returns to the element that opened it
  - The dialog has an accessible name from its title (aria-labelledby)
  - Content behind the dialog is not interactive while it is open
  - Scrolling the page behind the open dialog is prevented
---

## Problem

Build a reusable `Modal` controlled by an `open` prop. It must manage focus correctly and be
accessible to keyboard and screen-reader users.

## Constraints

Prefer platform features over hand-written focus traps.

## Examples

```jsx
<button onClick={() => setOpen(true)}>Delete</button>
<Modal open={open} title="Delete project?" onClose={() => setOpen(false)}>
  <p>This cannot be undone.</p>
</Modal>
```

## Solution

```jsx
import { useEffect, useId, useRef } from 'react'

export function Modal({ open, title, onClose, children }) {
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement
      dialog.showModal() // focus trap, Escape, ::backdrop and inert background
      document.body.style.overflow = 'hidden'
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleClose() {
    document.body.style.overflow = ''
    returnFocusRef.current?.focus()
    onClose()
  }

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} onClose={handleClose}>
      <h2 id={titleId}>{title}</h2>
      {children}
      <button type="button" onClick={() => dialogRef.current.close()}>
        Close
      </button>
    </dialog>
  )
}
```

## Explanation

`showModal()` puts the dialog in the browser's top layer, makes everything else inert, keeps Tab
focus inside, and closes on Escape — features that otherwise need a lot of custom code. The effect
keeps the native state in sync with the `open` prop. Every close path (Escape, the close button, a
parent setting `open` to false) ends in the `close` event, where we restore focus to the opener and
notify the parent.

## Common mistakes

- Building a div overlay without trapping focus — keyboard users tab behind the modal.
- Not returning focus to the trigger, leaving screen-reader users lost at the top of the page.
- Missing an accessible name for the dialog.
- Calling `onClose` and also toggling state inside the dialog, causing double updates.
- Follow-ups: close on backdrop click, `aria-describedby` for the message, animations with
  `prefers-reduced-motion`.
