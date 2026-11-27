// Sheets for lists: create/edit a list, add a watch to lists, edit an item's note.
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MyListForWatch } from '../../shared/types';
import { errorMessage } from '../lib/api';
import { plural } from '../lib/format';
import {
  useAddListItem,
  useCreateList,
  useMyListsForWatch,
  useRemoveListItem,
  useUpdateList,
  useUpdateListNote,
} from '../lib/queries';
import { Sheet } from './Sheet';
import { useToast } from './Toast';
import { Button, ErrorState, Field, FormError, SkeletonRows } from './ui';

export const MAX_LIST_NAME = 80;
export const MAX_LIST_DESCRIPTION = 500;
export const MAX_ITEM_NOTE = 280;

export function validateList(name: string, description: string): string | null {
  const n = name.trim();
  if (!n) return 'Give the list a name.';
  if (n.length > MAX_LIST_NAME) return `List names can be up to ${MAX_LIST_NAME} characters.`;
  if (description.trim().length > MAX_LIST_DESCRIPTION)
    return `Descriptions can be up to ${MAX_LIST_DESCRIPTION} characters.`;
  return null;
}

function TextArea({
  label,
  value,
  onChange,
  max,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange(v: string): void;
  max: number;
  rows?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label mb-1.5 block">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        maxLength={max}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-line bg-bg px-3 py-2 text-base text-ink placeholder:text-muted"
      />
      {value.length > max * 0.8 && (
        <p className="tabular mt-1 text-right text-xs text-muted">
          {value.length} / {max}
        </p>
      )}
    </div>
  );
}

/** Create a new list (then open it) or rename / re-describe an existing one. */
export function ListFormSheet({
  open,
  onClose,
  list,
}: {
  open: boolean;
  onClose(): void;
  list?: { id: string; name: string; description: string | null } | null;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateList();
  const update = useUpdateList();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(list?.name ?? '');
    setDescription(list?.description ?? '');
    setError(null);
  }, [open, list]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const problem = validateList(name, description);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    try {
      if (list) {
        await update.mutateAsync({ id: list.id, name: name.trim(), description });
        toast('List saved');
        onClose();
      } else {
        const { id } = await create.mutateAsync({ name: name.trim(), description });
        toast('List created');
        onClose();
        navigate(`/lists/${id}`);
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Sheet open={open} onClose={onClose} eyebrow={list ? 'Edit list' : 'New list'} title={list ? list.name : 'Make a list'}>
      <form onSubmit={save} noValidate className="space-y-4">
        <Field label="Name" value={name} maxLength={MAX_LIST_NAME} onChange={(e) => setName(e.target.value)} placeholder="Grails" autoComplete="off" />
        <TextArea label="Description (optional)" value={description} onChange={setDescription} max={MAX_LIST_DESCRIPTION} />
        <p className="text-xs text-muted">Everyone signed in can see your lists. Only you can change them.</p>
        <FormError message={error} />
        <Button type="submit" className="w-full" busy={create.isPending || update.isPending}>
          {list ? 'Save changes' : 'Create list'}
        </Button>
      </form>
    </Sheet>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span className={`grid size-7 shrink-0 place-items-center border ${on ? 'border-accent bg-accent text-on-accent' : 'border-line'}`} aria-hidden="true">
      {on && (
        <svg viewBox="0 0 24 24" className="size-5">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
        </svg>
      )}
    </span>
  );
}

/** "Add to list" from a watch page: tick my lists on and off, or make a new one with this watch in it. */
export function AddToListSheet({ open, onClose, watchId, title }: { open: boolean; onClose(): void; watchId: string; title: ReactNode }) {
  const toast = useToast();
  const lists = useMyListsForWatch(watchId, open);
  const add = useAddListItem();
  const remove = useRemoveListItem();
  const create = useCreateList();
  const [pending, setPending] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNewName('');
      setError(null);
    }
  }, [open]);

  async function toggle(l: MyListForWatch) {
    setPending(l.id);
    setError(null);
    try {
      if (l.contains) {
        await remove.mutateAsync({ listId: l.id, watchId });
        toast(`Removed from ${l.name}`);
      } else {
        await add.mutateAsync({ listId: l.id, watchId });
        toast(`Added to ${l.name}`);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  }

  async function createWithWatch(e: FormEvent) {
    e.preventDefault();
    const problem = validateList(newName, '');
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({ name: newName.trim(), description: '', watchId });
      toast(`Added to ${newName.trim()}`);
      setNewName('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Sheet open={open} onClose={onClose} eyebrow="Add to list" title={title}>
      <div className="space-y-5">
        {lists.isPending ? (
          <SkeletonRows rows={2} />
        ) : lists.isError ? (
          <ErrorState message={errorMessage(lists.error)} onRetry={() => void lists.refetch()} />
        ) : lists.data.length === 0 ? (
          <p className="text-muted">You don’t have any lists yet. Make one below.</p>
        ) : (
          <ul className="border-t border-line" aria-label="Your lists">
            {lists.data.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={l.contains}
                  disabled={pending === l.id}
                  onClick={() => void toggle(l)}
                  className="flex min-h-14 w-full items-center gap-3 border-b border-line py-2 text-left disabled:opacity-60"
                >
                  <Check on={l.contains} />
                  <span className="min-w-0 flex-1">
                    <span className="display block truncate text-xl">{l.name}</span>
                    <span className="mono block text-xs text-muted">{plural(l.item_count, 'watch', 'watches')}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={createWithWatch} noValidate className="space-y-2">
          <Field
            label="New list"
            value={newName}
            maxLength={MAX_LIST_NAME}
            placeholder="Grails, Wishlist, Under 40 mm…"
            onChange={(e) => setNewName(e.target.value)}
            autoComplete="off"
          />
          <Button type="submit" kind="secondary" className="w-full" busy={create.isPending} disabled={!newName.trim()}>
            Create and add
          </Button>
        </form>
        <FormError message={error} />
      </div>
    </Sheet>
  );
}

/** Edit the note on one watch in a list (the list's owner only). */
export function ItemNoteSheet({
  open,
  onClose,
  listId,
  item,
  title,
}: {
  open: boolean;
  onClose(): void;
  listId: string;
  item: { watch_id: string; note: string | null } | null;
  title: ReactNode;
}) {
  const toast = useToast();
  const update = useUpdateListNote();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNote(item?.note ?? '');
      setError(null);
    }
  }, [open, item]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!item) return;
    if (note.trim().length > MAX_ITEM_NOTE) {
      setError(`Notes can be up to ${MAX_ITEM_NOTE} characters.`);
      return;
    }
    try {
      await update.mutateAsync({ listId, watchId: item.watch_id, note });
      toast('Note saved');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Sheet open={open} onClose={onClose} eyebrow="Note" title={title}>
      <form onSubmit={save} noValidate className="space-y-4">
        <TextArea label="Note (optional)" value={note} onChange={setNote} max={MAX_ITEM_NOTE} placeholder="Why it’s on the list" />
        <FormError message={error} />
        <Button type="submit" className="w-full" busy={update.isPending}>
          Save note
        </Button>
      </form>
    </Sheet>
  );
}
