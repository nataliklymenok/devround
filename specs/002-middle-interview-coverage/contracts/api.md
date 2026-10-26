# HTTP API Additions (002): `/api/v1`

Extends [001 api](../../001-interview-prep-mvp/contracts/api.md): same auth (🔒 = session
required), origin check, error envelope, and 404 for items outside the user's active plan /
410 for unpublished items. New error code: `409 HINTS_USED` (cannot mark "Solved on my own").

## Changed

### `GET /catalog` 🔒
Technologies gain `recommends: string[]`.

### `GET /plans/current` 🔒 / `POST /plans` 🔒
`PlanDetailSchema` gains:
```json
{
  "modules": [ { "lessons": [ { "…": "…", "isDraft": false } ] } ],
  "tasks": [
    { "id": "js-debounce", "order": 1, "title": "Implement debounce", "technology": "JavaScript",
      "difficulty": "medium", "estimatedMinutes": 20, "mode": "tests", "isAvailable": true,
      "isDraft": true, "progress": { "status": null, "lastCheck": { "passed": 3, "total": 6 } } }
  ],
  "exercises": [
    { "id": "sd-autocomplete", "order": 1, "title": "Design an autocomplete",
      "timeboxMinutes": 45, "isAvailable": true, "isDraft": true,
      "progress": { "completed": false, "bestScore": null } }
  ]
}
```

### `GET /lessons/:id` 🔒
`LessonViewSchema` gains `references: { title, url }[]` and `isDraft`.

### `GET /dashboard` 🔒
`DashboardSchema` gains `areas: { kind: 'theory' | 'coding' | 'design', technology?: string,
completed: number, total: number }[]`; `topicsToReview` items gain `kind: 'lesson' | 'task' |
'exercise'` and `score: number` (task "revisit" = 0); up to 5 items. `continue` becomes
`{ kind, id } | null`.

## Coding tasks

| Method & path | Body | Response | Notes |
|---|---|---|---|
| `GET /tasks/:id` 🔒 | — | `200 TaskViewSchema` | statement, starterCode, `entry`, `tests` (tests mode) or `acceptanceCriteria`, `hints` = revealed only, `solution` = null unless revealed, `progress` (status, hintsRevealed, solutionRevealed, draftCode, lastCheck), `hintsTotal`, references, isDraft |
| `POST /tasks/:id/hints` 🔒 | `{}` | `200 { hint, index, hintsRevealed }` | reveals the next hint; 409 when none left |
| `POST /tasks/:id/solution` 🔒 | `{}` | `200 { solution }` | marks solution revealed for this attempt |
| `POST /tasks/:id/draft` 🔒 | `{ code }` (≤ 20 KB) | `204` | tests mode only, else 400 |
| `POST /tasks/:id/check-result` 🔒 | `{ passed, total }` | `204` | self-reported (R8); `passed ≤ total` |
| `POST /tasks/:id/status` 🔒 | `{ status: 'solved_own' \| 'solved_with_hints' \| 'revisit' }` | `200 progress` | `409 HINTS_USED` for solved_own after any reveal |
| `POST /tasks/:id/reset` 🔒 | `{}` | `200 progress` | new attempt; status kept |

## Design exercises

| Method & path | Body | Response | Notes |
|---|---|---|---|
| `GET /exercises/:id` 🔒 | — | `200 ExerciseViewSchema` | prompt, timebox, `sections: { key, title, body \| null }[]` (body only if revealed), checklist, progress, references, isDraft |
| `POST /exercises/:id/sections/:key/reveal` 🔒 | `{}` | `200 { key, body }` | 400 for unknown key |
| `POST /exercises/:id/assessment` 🔒 | `{ covered: string[] }` | `201 { score, coveredCount, total, progress }` | ids must exist in checklist (400 otherwise); keeps best score |
