import { useEffect, useId, useState, type FormEvent } from 'react';
import type { RatingEntry } from '../../shared/types';
import { errorMessage } from '../lib/api';
import { formatDate, localToday } from '../lib/format';
import { useCreateRating, useDeleteRating, useUpdateRating } from '../lib/queries';
import { ConfirmDialog } from './ConfirmDialog';
import { Dial } from './Dial';
import { Sheet } from './Sheet';
import { useToast } from './Toast';
import { Button, FormError } from './ui';

const MAX_REVIEW = 5000;

interface Props {
  open: boolean;
  onClose(): void;
  watchId: string;
  watchTitle: string;
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

export function RatingSheet({ open, onClose, watchId, watchTitle, latest, entry }: Props) {
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
      <Sheet open={open && !confirming} onClose={onClose} title={entry ? 'Edit entry' : 'Rate this watch'}>
        <form onSubmit={save} noValidate className="space-y-4">
          <p className="-mt-2 text-muted">{watchTitle}</p>
          {!entry && latest && (
            <p className="tabular rounded-xl bg-surface-2 px-3 py-2 text-sm">
              Your latest: <span className="font-semibold">{latest.score}/10</span> on{' '}
              {formatDate(latest.rated_on, { short: true })}
            </p>
          )}
          <Dial value={score} onChange={setScore} />
          <div>
            <label htmlFor={reviewId} className="mb-1 block text-sm font-medium">
              Review <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id={reviewId}
              rows={2}
              maxLength={MAX_REVIEW}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink"
              aria-describedby={`${reviewId}-count`}
            />
            {review.length > MAX_REVIEW - 500 && (
              <p id={`${reviewId}-count`} className="tabular mt-1 text-right text-xs text-muted">
                {review.length} / {MAX_REVIEW}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={dateId} className="mb-1 block text-sm font-medium">
              Date rated
            </label>
            <input
              id={dateId}
              type="date"
              max={today}
              value={ratedOn}
              onChange={(e) => setRatedOn(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink"
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
            <Button kind="secondary" className="ml-auto" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" busy={busy} disabled={score === null}>
              Save
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
