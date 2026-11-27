import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import type { Ownership } from '../../shared/types';
import { errorMessage } from '../lib/api';
import { localToday } from '../lib/format';
import { useCreateOwnership, useDeleteOwnership, useUpdateOwnership } from '../lib/queries';
import { ConfirmDialog } from './ConfirmDialog';
import { Sheet } from './Sheet';
import { useToast } from './Toast';
import { Button, FormError } from './ui';

export const MAX_NOTES = 1000;

export function validateOwnership(acquiredOn: string, soldOn: string, notes: string, today = localToday()): string | null {
  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  if (acquiredOn && !ymd.test(acquiredOn)) return 'Choose a valid acquired date.';
  if (soldOn && !ymd.test(soldOn)) return 'Choose a valid sold date.';
  if (acquiredOn > today) return 'The acquired date can’t be in the future.';
  if (soldOn > today) return 'The sold date can’t be in the future.';
  if (acquiredOn && soldOn && soldOn < acquiredOn) return 'The sold date can’t be before the acquired date.';
  if (notes.length > MAX_NOTES) return `Notes can be up to ${MAX_NOTES} characters.`;
  return null;
}

interface Props {
  open: boolean;
  onClose(): void;
  watchId: string;
  /** Sheet title: the watch's name (ReactNode so the nickname can be orange). */
  title: ReactNode;
  /** Edit mode: the ownership being edited. */
  ownership?: Ownership | null;
}

/** Add a watch to your collection, or edit / mark sold / remove a collection entry. */
export function OwnershipSheet({ open, onClose, watchId, title, ownership }: Props) {
  const acquiredId = useId();
  const soldId = useId();
  const notesId = useId();
  const toast = useToast();
  const create = useCreateOwnership();
  const update = useUpdateOwnership();
  const remove = useDeleteOwnership();

  const [acquiredOn, setAcquiredOn] = useState('');
  const [soldOn, setSoldOn] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAcquiredOn(ownership?.acquired_on ?? '');
    setSoldOn(ownership?.sold_on ?? '');
    setNotes(ownership?.notes ?? '');
    setError(null);
  }, [open, ownership]);

  const today = localToday();

  async function save(e: FormEvent) {
    e.preventDefault();
    const problem = validateOwnership(acquiredOn, soldOn, notes, today);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    try {
      const input = { acquiredOn, soldOn, notes };
      if (ownership) await update.mutateAsync({ id: ownership.id, ...input });
      else await create.mutateAsync({ watchId, ...input });
      toast(ownership ? 'Collection updated' : 'Added to your collection');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function doDelete() {
    if (!ownership) return;
    try {
      await remove.mutateAsync(ownership.id);
      setConfirming(false);
      toast('Removed from your collection');
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(errorMessage(err));
    }
  }

  const inputClass = 'min-h-12 w-full border border-line bg-bg px-3 text-base text-ink';

  return (
    <>
      <Sheet open={open && !confirming} onClose={onClose} eyebrow={ownership ? 'Edit ownership' : 'I own this'} title={title}>
        <form onSubmit={save} noValidate className="space-y-4">
          {!ownership && (
            <p className="text-sm text-muted">
              Adds one watch to your collection. Own two? Add it twice. Everything here is optional.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={acquiredId} className="label mb-1.5 block">
                Acquired
              </label>
              <input id={acquiredId} type="date" max={today} value={acquiredOn} onChange={(e) => setAcquiredOn(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor={soldId} className="label mb-1.5 block">
                Sold
              </label>
              <input id={soldId} type="date" max={today} min={acquiredOn || undefined} value={soldOn} onChange={(e) => setSoldOn(e.target.value)} className={inputClass} />
            </div>
          </div>
          {ownership && !ownership.sold_on && !soldOn && (
            <Button kind="ghost" className="-ml-5" onClick={() => setSoldOn(today)}>
              Mark as sold today
            </Button>
          )}
          <div>
            <label htmlFor={notesId} className="label mb-1.5 block">
              Notes (optional)
            </label>
            <textarea
              id={notesId}
              rows={3}
              maxLength={MAX_NOTES}
              value={notes}
              placeholder="Box and papers, where you bought it, the serial…"
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-line bg-bg px-3 py-2 text-base text-ink placeholder:text-muted"
            />
            {notes.length > MAX_NOTES - 200 && (
              <p className="tabular mt-1 text-right text-xs text-muted">
                {notes.length} / {MAX_NOTES}
              </p>
            )}
          </div>
          <p className="text-xs text-muted">Everyone signed in can see who owns a watch. Ownership doesn’t appear in the activity feed.</p>
          <FormError message={error} />
          <div className="flex gap-2">
            {ownership && (
              <Button kind="danger" onClick={() => setConfirming(true)}>
                Remove
              </Button>
            )}
            <Button type="submit" className="flex-1" busy={create.isPending || update.isPending}>
              {ownership ? 'Save changes' : 'Add to collection'}
            </Button>
          </div>
        </form>
      </Sheet>
      <ConfirmDialog
        open={confirming}
        title="Remove from collection?"
        message="This deletes the record, including its dates and notes. To keep it as a past watch, set a sold date instead."
        confirmLabel="Remove"
        busy={remove.isPending}
        onConfirm={doDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
