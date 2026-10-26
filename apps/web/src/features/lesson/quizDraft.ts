/** Unsent quiz answers survive a session expiry + re-sign-in (spec edge case, I1). */
const key = (lessonId: string) => `quiz-draft:${lessonId}`

export type Draft = (number | null)[]

export function loadDraft(lessonId: string, length: number): Draft {
  try {
    const raw = sessionStorage.getItem(key(lessonId))
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (
      Array.isArray(parsed) &&
      parsed.length === length &&
      parsed.every((v) => v === null || Number.isInteger(v))
    ) {
      return parsed as Draft
    }
  } catch {
    // Storage unavailable or corrupted: start empty.
  }
  return Array.from({ length }, () => null)
}

export function saveDraft(lessonId: string, draft: Draft) {
  try {
    sessionStorage.setItem(key(lessonId), JSON.stringify(draft))
  } catch {
    // Ignore: the draft is a convenience only.
  }
}

export function clearDraft(lessonId: string) {
  try {
    sessionStorage.removeItem(key(lessonId))
  } catch {
    // Ignore.
  }
}
