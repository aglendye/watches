import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CollectionItem } from '../../shared/types';
import { OwnershipSheet } from '../components/OwnershipSheet';
import { WatchImage } from '../components/WatchArt';
import { WatchName } from '../components/WatchItems';
import { BackLink, EmptyState, ErrorState, SectionTitle, SkeletonRows } from '../components/ui';
import { errorMessage } from '../lib/api';
import { formatDate, plural, watchTitle } from '../lib/format';
import { useCollection } from '../lib/queries';

const nick = (x: unknown) => (typeof x === 'string' && x ? x : null);

function dates(o: CollectionItem): string {
  const parts: string[] = [];
  if (o.acquired_on) parts.push(`Acquired ${formatDate(o.acquired_on)}`);
  if (o.sold_on) parts.push(`Sold ${formatDate(o.sold_on)}`);
  return parts.length ? parts.join(' · ') : 'No dates';
}

function Row({ o, onEdit }: { o: CollectionItem; onEdit(): void }) {
  const t = watchTitle(o);
  const nickname = nick(o.extras?.nickname);
  return (
    <li className="flex items-stretch border-b border-line">
      <button
        type="button"
        onClick={onEdit}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2.5 text-left"
        aria-label={`${t.title}${nickname ? ` “${nickname}”` : ''}. ${dates(o)}. Edit`}
      >
        <div className="hero grid size-14 shrink-0 place-items-center">
          <WatchImage watch={o} photoUrl={o.primary_image_url} className="size-12" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label !text-[0.625rem]">{o.brand_name}</p>
          <p className="display line-clamp-2 text-xl leading-[1.05]">{o.model_name}</p>
          {nickname && <p className="truncate text-sm font-semibold text-accent">“{nickname}”</p>}
          <p className="mono mt-0.5 text-xs text-muted">{dates(o)}</p>
          {o.notes && <p className="mt-1 truncate text-sm">{o.notes}</p>}
        </div>
      </button>
      <Link
        to={`/watch/${o.watch_id}`}
        className="grid w-11 shrink-0 place-items-center text-2xl text-muted"
        aria-label={`Open the ${t.title} page`}
      >
        ›
      </Link>
    </li>
  );
}

export function Collection() {
  const collection = useCollection();
  const [editing, setEditing] = useState<CollectionItem | null>(null);
  const items = collection.data ?? [];
  const current = items.filter((o) => !o.sold_on);
  const past = items.filter((o) => o.sold_on);

  return (
    <div className="space-y-5">
      <BackLink to="/me">Me</BackLink>
      <div>
        <h1 className="display text-[2.75rem]">My Collection</h1>
        {items.length > 0 && <p className="mono text-sm text-muted">{plural(current.length, 'watch', 'watches')} now</p>}
      </div>
      {collection.isPending ? (
        <SkeletonRows rows={4} />
      ) : collection.isError ? (
        <ErrorState message={errorMessage(collection.error)} onRetry={() => void collection.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Your collection is empty. Open a watch you own and tap “I own this”."
          action={
            <Link to="/search" className="display inline-flex min-h-12 items-center bg-accent px-5 text-lg tracking-[0.06em] text-on-accent">
              Find a watch
            </Link>
          }
        />
      ) : (
        <>
          <section aria-labelledby="current-title">
            <SectionTitle id="current-title">Current</SectionTitle>
            {current.length === 0 ? (
              <p className="border-y border-line py-4 text-muted">Nothing right now. Past watches are below.</p>
            ) : (
              <ul className="border-t border-line">
                {current.map((o) => (
                  <Row key={o.id} o={o} onEdit={() => setEditing(o)} />
                ))}
              </ul>
            )}
          </section>
          {past.length > 0 && (
            <section aria-labelledby="past-title">
              <SectionTitle id="past-title">Past</SectionTitle>
              <ul className="border-t border-line">
                {past.map((o) => (
                  <Row key={o.id} o={o} onEdit={() => setEditing(o)} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      <OwnershipSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        watchId={editing?.watch_id ?? ''}
        ownership={editing}
        title={editing ? <WatchName w={editing} /> : ''}
      />
    </div>
  );
}
