import { useEffect, useId, useState, type FormEvent } from 'react';
import type { RatingEntry } from '../../shared/types';
import { errorMessage } from '../lib/api';
import { formatDate, localToday } from '../lib/format';
import { useCreateRating, useDeleteRating, useUpdateRating } from '../lib/queries';
import { ConfirmDialog } from './ConfirmDialog';
import { Dial } from './Dial';
import type { ArtInput } from '../lib/watchArt';
import { Sheet } from './Sheet';
import { useToast } from './Toast';
import { Button, FormError } from './ui';

const MAX_REVIEW = 5000;

interface Props {
  open: boolean;
  onClose(): void;
  watchId: string;
  watchTitle: string;
  /** The watch, so the dial is drawn as it. */
  watch?: ArtInput;
  /** The viewer's latest entry for this watch, shown above the dial when adding a new one. */
  latest?: Pick<RatingEntry, 'score' | 'rated_on'> | null;
  /** Edit mode: the entry being edited. */
  entry?: RatingEntry | null;
}

export function validateRating(score: number | null, ratedOn: string, today = localToday()): string | null {
  if (score === null) return 'Pick a score.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ratedOn)) return 'Choose the date you rated it.';
  if (ratedOn > today) return 'The date rated can’t be in the future.';
  return null;
}

export function RatingSheet({ open, onClose, watchId, watchTitle, watch, latest, entry }: Props) {
  const reviewId = useId();
  const dateId = useId();
  const toast = useToast();
  const create = useCreateRating();
  const update = useUpdateRating();
  const remove = useDeleteRating();

  const [score, setScore] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [ratedOn, setRatedOn] = useState(localToday());
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScore(entry?.score ?? null);
    setReview(entry?.review_text ?? '');
    setRatedOn(entry?.rated_on ?? localToday());
    setError(null);
  }, [open, entry]);

  const today = localToday();
  const nickname = typeof watch?.extras?.nickname === 'string' && watch.extras.nickname ? watch.extras.nickname : null;
  const busy = create.isPending || update.isPending;

  async function save(e: FormEvent) {
    e.preventDefault();
    const problem = validateRating(score, ratedOn, today);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    try {
      const input = { score: score!, reviewText: review, ratedOn };
      if (entry) await update.mutateAsync({ id: entry.id, ...input });
      else await create.mutateAsync({ watchId, ...input });
      toast(entry ? 'Entry updated' : 'Rating saved');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function doDelete() {
    if (!entry) return;
    try {
      await remove.mutateAsync(entry.id);
      setConfirming(false);
      toast('Entry deleted');
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <Sheet
        open={open && !confirming}
        onClose={onClose}
        eyebrow={entry ? 'Edit entry' : 'Your rating'}
        title={
          <>
            {watchTitle}
            {nickname && <span className="text-accent"> “{nickname}”</span>}
          </>
        }
      >
        <form onSubmit={save} noValidate className="space-y-4">
          {!entry && latest && (
            <p className="tabular border border-line px-3 py-2 text-sm">
              Your latest: <span className="font-semibold">{latest.score}/10</span> on{' '}
              {formatDate(latest.rated_on, { short: true })}
            </p>
          )}
          <Dial value={score} onChange={setScore} watch={watch} />
          <div>
            <label htmlFor={reviewId} className="label mb-1.5 block">
              Review (optional)
            </label>
            <textarea
              id={reviewId}
              rows={2}
              maxLength={MAX_REVIEW}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full border border-line bg-bg px-3 py-2 text-base text-ink"
              aria-describedby={`${reviewId}-count`}
            />
            {review.length > MAX_REVIEW - 500 && (
              <p id={`${reviewId}-count`} className="tabular mt-1 text-right text-xs text-muted">
                {review.length} / {MAX_REVIEW}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={dateId} className="label mb-1.5 block">
              Date rated
            </label>
            <input
              id={dateId}
              type="date"
              max={today}
              value={ratedOn}
              onChange={(e) => setRatedOn(e.target.value)}
              className="min-h-12 w-full border border-line bg-bg px-3 text-base text-ink"
            />
          </div>
          <FormError message={error} />
          <div
            className="sticky -mx-4 flex gap-2 border-t border-line bg-surface px-4 pt-3"
            style={{ bottom: 'calc(-1 * max(1rem, env(safe-area-inset-bottom)))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {entry && (
              <Button kind="danger" onClick={() => setConfirming(true)}>
                Delete
              </Button>
            )}
            <Button type="submit" className="flex-1" busy={busy} disabled={score === null}>
              {entry ? 'Save changes' : score === null ? 'Save rating' : `Save rating · ${score}`}
            </Button>
          </div>
        </form>
      </Sheet>
      <ConfirmDialog
        open={confirming}
        title="Delete this entry?"
        message="This removes it from your diary. It can’t be undone."
        confirmLabel="Delete"
        busy={remove.isPending}
        onConfirm={doDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
