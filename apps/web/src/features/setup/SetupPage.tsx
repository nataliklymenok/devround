import type { CatalogResponse } from '@devround/shared'
import { useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../api/client'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import { useMe } from '../auth/hooks'
import { useCatalog, useCreatePlan } from '../plan/hooks'
import styles from './setup.module.css'

export function SetupPage() {
  const catalog = useCatalog()
  if (catalog.isPending) return <Spinner label="Loading interview options…" />
  if (catalog.isError) {
    return (
      <ErrorState
        message="We could not load interview options."
        onRetry={() => catalog.refetch()}
      />
    )
  }
  return <SetupForm catalog={catalog.data} />
}

function SetupForm({ catalog }: { catalog: CatalogResponse }) {
  const me = useMe()
  const createPlan = useCreatePlan()
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const hintId = useId()

  const [trackId, setTrackId] = useState(() => catalog.tracks.find((t) => t.isAvailable)?.id ?? '')
  const [levelId, setLevelId] = useState('')
  const [technologyIds, setTechnologyIds] = useState<string[]>([])

  const track = catalog.tracks.find((t) => t.id === trackId)
  const hasActivePlan = me.data?.hasActivePlan ?? false

  const missing = [
    !trackId && 'a track',
    !levelId && 'a level',
    technologyIds.length === 0 && 'at least one technology',
  ].filter(Boolean)
  const hint = missing.length > 0 ? `Choose ${missing.join(', ')} to continue.` : null

  const selectTrack = (id: string) => {
    setTrackId(id)
    // Technologies belong to a track; reset them when the track changes.
    setTechnologyIds([])
  }

  // FR-008: technologies often asked together with the selection, not yet selected.
  const recommended =
    track?.technologies.filter(
      (t) =>
        t.isAvailable &&
        !technologyIds.includes(t.id) &&
        track.technologies.some((s) => technologyIds.includes(s.id) && s.recommends.includes(t.id)),
    ) ?? []

  const toggleTechnology = (id: string) =>
    setTechnologyIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const submit = (replaceExisting: boolean) => {
    // Keep catalog order so the request is stable regardless of click order.
    const ordered =
      track?.technologies.map((t) => t.id).filter((id) => technologyIds.includes(id)) ?? []
    createPlan.mutate(
      { trackId, levelId, technologyIds: ordered, replaceExisting },
      { onSuccess: () => navigate('/plan') },
    )
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (hint || createPlan.isPending) return
    if (hasActivePlan) dialogRef.current?.showModal()
    else submit(false)
  }

  const errorMessage =
    createPlan.error instanceof ApiError
      ? createPlan.error.message
      : createPlan.error
        ? 'We could not create your plan. Please try again.'
        : null

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <header>
        <h1 className={styles.title}>Choose your interview</h1>
        <p className={styles.lead}>
          Tell us what you are preparing for — we will assemble a plan of lessons for it.
        </p>
      </header>

      <fieldset className={styles.fieldset}>
        <legend>Track</legend>
        <div className={styles.cards}>
          {catalog.tracks.map((t) => (
            <label key={t.id} className={styles.card} data-disabled={!t.isAvailable || undefined}>
              <input
                type="radio"
                name="track"
                value={t.id}
                checked={trackId === t.id}
                disabled={!t.isAvailable}
                onChange={() => selectTrack(t.id)}
              />
              <span className={styles.cardName}>{t.name}</span>
              {!t.isAvailable && <span className={styles.badge}>Coming soon</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Level</legend>
        <div className={styles.cards}>
          {catalog.levels.map((l) => (
            <label key={l.id} className={styles.card}>
              <input
                type="radio"
                name="level"
                value={l.id}
                checked={levelId === l.id}
                onChange={() => setLevelId(l.id)}
              />
              <span className={styles.cardName}>{l.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Technologies</legend>
        <div className={styles.cards}>
          {track?.technologies.map((t) => (
            <label key={t.id} className={styles.card} data-disabled={!t.isAvailable || undefined}>
              <input
                type="checkbox"
                name="technologies"
                value={t.id}
                checked={technologyIds.includes(t.id)}
                disabled={!t.isAvailable}
                onChange={() => toggleTechnology(t.id)}
              />
              <span className={styles.cardName}>{t.name}</span>
              {!t.isAvailable && <span className={styles.badge}>Coming soon</span>}
            </label>
          ))}
        </div>
      </fieldset>

      {recommended.length > 0 && (
        <div className={styles.recommend} role="note">
          <span>
            Often asked together with your selection:{' '}
            <strong>{recommended.map((t) => t.name).join(', ')}</strong>
          </span>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setTechnologyIds((ids) => [...ids, ...recommended.map((t) => t.id)])}
          >
            Add {recommended.length === 1 ? 'it' : 'them'}
          </button>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="submit"
          className="button"
          disabled={Boolean(hint) || createPlan.isPending}
          aria-describedby={hint ? hintId : undefined}
        >
          {createPlan.isPending ? 'Creating plan…' : 'Create my plan'}
        </button>
        {hint && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
        {errorMessage && (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        )}
      </div>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={`${hintId}-dialog`}>
        <h2 id={`${hintId}-dialog`}>Replace your current plan?</h2>
        <p>
          Your current plan will be archived and replaced by the new one. Lessons you already
          completed stay completed.
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => dialogRef.current?.close()}
          >
            Keep current plan
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              dialogRef.current?.close()
              submit(true)
            }}
          >
            Replace plan
          </button>
        </div>
      </dialog>
    </form>
  )
}
