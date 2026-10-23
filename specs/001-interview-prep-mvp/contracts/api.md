# HTTP API Contract: `/api/v1`

**Feature**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)
(rev. 2 — curated content; all operations synchronous)

- JSON only. Request/response schemas are Zod schemas exported from `packages/shared`
  (names given below); TypeScript types are inferred from them.
- Auth: `dr_session` httpOnly cookie. Endpoints marked 🔒 return `401 UNAUTHENTICATED` without a
  valid session.
- Mutating requests must send `Content-Type: application/json` and a matching `Origin`
  (otherwise `403 FORBIDDEN_ORIGIN`).
- Resources not owned by / not in the plan of the current user respond `404 NOT_FOUND`.

## Error envelope (`ApiErrorSchema`)

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human-readable text", "details": {} } }
```

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | body/params fail schema |
| 401 | `UNAUTHENTICATED` | no/expired session, invalid Google token |
| 403 | `FORBIDDEN_ORIGIN` | CSRF origin check failed |
| 404 | `NOT_FOUND` | missing, not owned, or not in user's active plan |
| 409 | `ACTIVE_PLAN_EXISTS` | create plan without `replaceExisting` while one exists |
| 410 | `LESSON_UNAVAILABLE` | lesson in plan but unpublished |
| 422 | `TRACK_UNAVAILABLE` | track/technology is "coming soon" or not in track |
| 429 | `RATE_LIMITED` | per-IP limit |
| 500 | `INTERNAL` | unexpected |

## Auth

### `POST /auth/google`
Request `GoogleSignInRequestSchema`: `{ "credential": string }` (GIS ID token)
Response `200` `MeResponseSchema` + `Set-Cookie: dr_session=...; HttpOnly; Secure; SameSite=Lax`
Errors: 400, 401, 429.

### `POST /auth/logout` 🔒
Response `204`; clears cookie, deletes session.

### `GET /me` 🔒
Response `200` `MeResponseSchema`:
```json
{ "user": { "id": "u1", "email": "a@b.com", "name": "Ann", "avatarUrl": "https://..." },
  "hasActivePlan": true }
```

## Catalog

### `GET /catalog` 🔒
Response `200` `CatalogResponseSchema`:
```json
{
  "tracks": [
    { "id": "frontend", "name": "Frontend", "isAvailable": true,
      "technologies": [ { "id": "react", "name": "React", "isAvailable": true },
                        { "id": "html-css", "name": "HTML & CSS", "isAvailable": false } ] },
    { "id": "qa", "name": "QA", "isAvailable": false, "technologies": [] }
  ],
  "levels": [ { "id": "middle", "name": "Middle", "rank": 2 } ]
}
```

## Plans

### `POST /plans` 🔒
Request `CreatePlanRequestSchema`:
```json
{ "trackId": "frontend", "levelId": "middle", "technologyIds": ["react", "typescript"],
  "replaceExisting": false }
```
Rules: `technologyIds` non-empty, unique, available, belong to the track (FR-012).
Response `201` `PlanDetailSchema` (same shape as `GET /plans/current`).
Errors: 400, 409 `ACTIVE_PLAN_EXISTS`, 422.

### `GET /plans/current` 🔒
Response `200` `PlanDetailSchema`:
```json
{
  "id": "p2",
  "target": { "track": "Frontend", "level": "Middle", "technologies": ["TypeScript", "React"] },
  "modules": [
    { "id": "react-hooks", "title": "Hooks in depth", "technology": "React",
      "lessons": [
        { "id": "react-hooks-rules", "order": 7, "title": "Rules of Hooks",
          "description": "...", "estimatedMinutes": 20, "isAvailable": true,
          "progress": { "completed": true, "bestScore": 80 } }
      ] }
  ]
}
```
`404` when the user has no active plan.

## Lessons

### `GET /lessons/{lessonId}` 🔒
Lesson must be in the user's active plan. Side effect: upserts `LessonProgress.lastOpenedAt`.
Response `200` `LessonViewSchema`:
```json
{
  "id": "react-hooks-rules", "title": "Rules of Hooks", "moduleTitle": "Hooks in depth",
  "technology": "React", "order": 7, "estimatedMinutes": 20,
  "body": "## Why the rules exist\n...",
  "interviewQuestions": [ { "question": "...", "answer": "..." } ],
  "keyTakeaways": ["..."],
  "quiz": [ { "id": "q1", "question": "...", "options": ["A", "B", "C"] } ],
  "progress": { "completed": false, "bestScore": null },
  "prevLessonId": "react-state-basics", "nextLessonId": "react-custom-hooks"
}
```
Quiz items exclude `correct` and `explanation` (FR-018). `prev/next` skip unavailable lessons.
Errors: 404, 410 `LESSON_UNAVAILABLE`.

### `POST /lessons/{lessonId}/attempts` 🔒
Request `QuizAttemptRequestSchema`: `{ "answers": [1, 0, 2] }` — length equals quiz length, each
index within its options.
Response `201` `QuizAttemptResultSchema`:
```json
{
  "attemptId": "a1", "score": 67, "correctCount": 2, "totalCount": 3,
  "results": [ { "questionId": "q1", "selected": 1, "correct": 1,
                 "isCorrect": true, "explanation": "..." } ],
  "progress": { "completed": true, "bestScore": 67 },
  "nextLessonId": "react-custom-hooks"
}
```
Errors: 400, 404, 410.

## Dashboard

### `GET /dashboard` 🔒
Response `200` `DashboardSchema`:
```json
{
  "target": { "track": "Frontend", "level": "Middle", "technologies": ["TypeScript", "React"] },
  "overall": { "completed": 6, "total": 24, "percent": 25 },
  "modules": [ { "id": "react-hooks", "title": "Hooks in depth", "completed": 4, "total": 5 } ],
  "averageBestScore": 82,
  "topicsToReview": [ { "lessonId": "ts-generics", "title": "Generics", "bestScore": 50 } ],
  "continueLessonId": "react-custom-hooks",
  "isComplete": false
}
```
`404` when there is no active plan.
