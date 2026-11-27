import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ListItem, ListSummary } from '../../shared/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ItemNoteSheet, ListFormSheet } from '../components/ListSheets';
import { useToast } from '../components/Toast';
import { WatchImage } from '../components/WatchArt';
import { ListGlyph, WatchName } from '../components/WatchItems';
import { BackLink, Button, EmptyState, ErrorState, SectionTitle, SkeletonRows } from '../components/ui';
import { errorMessage } from '../lib/api';
import { useMe } from '../lib/auth';
import { formatDate, localToday, plural, watchTitle } from '../lib/format';
import { useDeleteList, useList, useLists, useRemoveListItem } from '../lib/queries';

const nick = (x: unknown) => (typeof x === 'string' && x ? x : null);

function ListRow({ l, meId }: { l: ListSummary; meId: string }) {
  return (
    <li>
      <Link to={`/lists/${l.id}`} className="flex min-h-16 items-center gap-3 border-b border-line py-2.5">
        <div className="hero grid size-14 shrink-0 place-items-center text-ink">
          {l.preview[0] ? <WatchImage watch={l.preview[0]} photoUrl={l.preview[0].primary_image_url} className="size-12" /> : <ListGlyph className="size-7" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="label !text-[0.625rem]">{l.user_id === meId ? 'Yours' : l.display_name}</p>
          <p className="display line-clamp-2 text-xl leading-[1.05]">{l.name}</p>
          {l.description && <p className="mt-0.5 truncate text-sm text-muted">{l.description}</p>}
        </div>
        <span className="mono shrink-0 text-xs text-muted">{plural(l.item_count, 'watch', 'watches')}</span>
      </Link>
    </li>
  );
}

export function Lists() {
  const me = useMe();
  const lists = useLists();
  const [creating, setCreating] = useState(false);
  const mine = lists.data?.filter((l) => l.is_mine) ?? [];
  const others = lists.data?.filter((l) => !l.is_mine) ?? [];

  return (
    <div className="space-y-5">
      <BackLink to="/me">Me</BackLink>
      <div className="flex items-end justify-between gap-3">
        <h1 className="display text-[2.75rem]">Lists</h1>
        <Button kind="secondary" className="mb-1 !min-h-11 !px-4" onClick={() => setCreating(true)}>
          New list
        </Button>
      </div>
      {lists.isPending ? (
        <SkeletonRows rows={4} />
      ) : lists.isError ? (
        <ErrorState message={errorMessage(lists.error)} onRetry={() => void lists.refetch()} />
      ) : lists.data.length === 0 ? (
        <EmptyState
          title="No lists yet. Make one for your grails, your wishlist, or anything else."
          action={<Button onClick={() => setCreating(true)}>Make a list</Button>}
        />
      ) : (
        <>
          <section aria-labelledby="mine-title">
            <SectionTitle id="mine-title">Your lists</SectionTitle>
            {mine.length === 0 ? (
              <p className="border-y border-line py-4 text-muted">You haven’t made one yet.</p>
            ) : (
              <ul className="border-t border-line">
                {mine.map((l) => (
                  <ListRow key={l.id} l={l} meId={me.id} />
                ))}
              </ul>
            )}
          </section>
          {others.length > 0 && (
            <section aria-labelledby="others-title">
              <SectionTitle id="others-title">Everyone else’s</SectionTitle>
              <ul className="border-t border-line">
                {others.map((l) => (
                  <ListRow key={l.id} l={l} meId={me.id} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      <ListFormSheet open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function ItemRow({
  item,
  isOwner,
  onNote,
  onRemove,
}: {
  item: ListItem;
  isOwner: boolean;
  onNote(): void;
  onRemove(): void;
}) {
  const t = watchTitle(item);
  const nickname = nick(item.extras?.nickname);
  return (
    <li className="border-b border-line py-2.5">
      <Link to={`/watch/${item.watch_id}`} className="flex min-h-14 items-center gap-3">
        <div className="hero grid size-14 shrink-0 place-items-center">
          <WatchImage watch={item} photoUrl={item.primary_image_url} className="size-12" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label !text-[0.625rem]">{item.brand_name}</p>
          <p className="display line-clamp-2 text-xl leading-[1.05]">{item.model_name}</p>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm">
            {nickname && <span className="min-w-0 font-semibold break-words text-accent">“{nickname}”</span>}
            {t.hasReference && <span className="mono text-xs text-muted">{item.reference}</span>}
          </p>
        </div>
      </Link>
      {item.note && <p className="mt-2 border-l-2 border-accent pl-3 text-[0.9375rem] whitespace-pre-line">{item.note}</p>}
      {isOwner && (
        <div className="mt-1 flex justify-end gap-1">
          <Button kind="ghost" className="!min-h-11 !px-3" onClick={onNote} aria-label={`${item.note ? 'Edit' : 'Add'} note for ${t.title}`}>
            {item.note ? 'Edit note' : 'Add note'}
          </Button>
          <Button kind="ghost" className="!min-h-11 !px-3 !text-danger" onClick={onRemove} aria-label={`Remove ${t.title} from this list`}>
            Remove
          </Button>
        </div>
      )}
    </li>
  );
}

export function ListDetailScreen() {
  const { id = '' } = useParams();
  const me = useMe();
  const navigate = useNavigate();
  const toast = useToast();
  const list = useList(id);
  const removeItem = useRemoveListItem();
  const deleteList = useDeleteList();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noteFor, setNoteFor] = useState<ListItem | null>(null);
  const [removing, setRemoving] = useState<ListItem | null>(null);

  if (list.isPending) return <SkeletonRows rows={5} />;
  if (list.isError) return <ErrorState message={errorMessage(list.error)} onRetry={() => void list.refetch()} />;

  const l = list.data;
  const isOwner = l.user_id === me.id;

  async function doRemove() {
    if (!removing) return;
    try {
      await removeItem.mutateAsync({ listId: l.id, watchId: removing.watch_id });
      toast('Removed from the list');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
    setRemoving(null);
  }

  async function doDelete() {
    try {
      await deleteList.mutateAsync(l.id);
      toast('List deleted');
      navigate('/lists', { replace: true });
    } catch (err) {
      setConfirmDelete(false);
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <BackLink to="/lists">Lists</BackLink>
        {isOwner && (
          <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center font-semibold text-muted">
            Edit
          </button>
        )}
      </div>
      <header>
        <p className="label">
          {isOwner ? 'Your list' : `${l.display_name}’s list`} · {formatDate(localToday(new Date(l.created_at)), { short: true })}
        </p>
        <h1 className="display mt-1 text-[2.5rem] leading-[1.02] break-words">{l.name}</h1>
        {l.description && <p className="mt-2 whitespace-pre-line text-[0.9375rem]">{l.description}</p>}
      </header>

      <section aria-labelledby="items-title">
        <SectionTitle id="items-title">{plural(l.items.length, 'watch', 'watches')}</SectionTitle>
        {l.items.length === 0 ? (
          <EmptyState
            title={isOwner ? 'Nothing on this list yet. Open a watch and tap “Add to list”.' : 'Nothing on this list yet.'}
            action={
              isOwner ? (
                <Link to="/search" className="display inline-flex min-h-12 items-center bg-accent px-5 text-lg tracking-[0.06em] text-on-accent">
                  Find a watch
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="border-t border-line">
            {l.items.map((item) => (
              <ItemRow key={item.watch_id} item={item} isOwner={isOwner} onNote={() => setNoteFor(item)} onRemove={() => setRemoving(item)} />
            ))}
          </ul>
        )}
      </section>

      {isOwner && (
        <Button kind="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
          Delete list
        </Button>
      )}

      <ListFormSheet open={editing} onClose={() => setEditing(false)} list={l} />
      <ItemNoteSheet open={!!noteFor} onClose={() => setNoteFor(null)} listId={l.id} item={noteFor} title={noteFor ? <WatchName w={noteFor} /> : ''} />
      <ConfirmDialog
        open={!!removing}
        title="Remove from this list?"
        message={removing ? `${watchTitle(removing).title} and its note will be taken off “${l.name}”.` : ''}
        confirmLabel="Remove"
        busy={removeItem.isPending}
        onConfirm={() => void doRemove()}
        onCancel={() => setRemoving(null)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this list?"
        message={`“${l.name}” and its notes will be deleted. The watches stay in the catalog. This can’t be undone.`}
        confirmLabel="Delete"
        busy={deleteList.isPending}
        onConfirm={() => void doDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
