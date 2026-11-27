import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CollectionItem, PersonRating } from '../../shared/types';
import { WatchImage } from '../components/WatchArt';
import { ListGlyph } from '../components/WatchItems';
import { BackLink, Button, EmptyState, ErrorState, SectionTitle, SkeletonRows } from '../components/ui';
import { errorMessage } from '../lib/api';
import { formatDate, localToday, plural } from '../lib/format';
import { usePeople, usePerson } from '../lib/queries';

const nick = (x: unknown) => (typeof x === 'string' && x ? x : null);
const RATINGS_SHOWN = 10;

export function People() {
  const people = usePeople();
  return (
    <div className="space-y-5">
      <BackLink to="/me">Me</BackLink>
      <h1 className="display text-[2.75rem]">People</h1>
      {people.isPending ? (
        <SkeletonRows rows={3} />
      ) : people.isError ? (
        <ErrorState message={errorMessage(people.error)} onRetry={() => void people.refetch()} />
      ) : people.data.length <= 1 ? (
        <EmptyState title="It’s just you so far. Send someone the link so they can make an account." />
      ) : (
        <ul className="border-t border-line">
          {people.data.map((p, i) => (
            <li key={p.id}>
              <Link to={`/people/${p.id}`} className="flex min-h-16 items-center gap-3 border-b border-line py-2.5">
                <span className="display grid size-12 shrink-0 place-items-center border border-line text-2xl" aria-hidden="true">
                  {p.display_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="display block truncate text-2xl">
                    {p.display_name}
                    {i === 0 && <span className="label ml-2 align-middle !text-[0.625rem]">You</span>}
                  </span>
                  <span className="mono block text-xs text-muted">
                    {plural(p.rated_count, 'rating')} · owns {p.owned_count} · {plural(p.list_count, 'list')}
                  </span>
                </span>
                <span aria-hidden="true" className="text-2xl text-muted">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A watch row with its picture, used for a person's ratings and collection. */
function WatchLine({
  w,
  watchId,
  detail,
  right,
  extra,
}: {
  w: PersonRating | CollectionItem;
  watchId: string;
  detail?: string;
  right?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  const nickname = nick(w.extras?.nickname);
  return (
    <li>
      <Link to={`/watch/${watchId}`} className="flex min-h-16 items-center gap-3 border-b border-line py-2.5">
        <div className="hero grid size-14 shrink-0 place-items-center">
          <WatchImage watch={w} photoUrl={w.primary_image_url} className="size-12" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label !text-[0.625rem]">{w.brand_name}</p>
          <p className="display line-clamp-2 text-xl leading-[1.05]">{w.model_name}</p>
          {nickname && <p className="truncate text-sm font-semibold text-accent">“{nickname}”</p>}
          {detail && <p className="mono mt-0.5 text-xs text-muted">{detail}</p>}
          {extra}
        </div>
        {right}
      </Link>
    </li>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3 py-3 first:pl-0">
      <p className="num text-[2.25rem] leading-none text-accent">{value}</p>
      <p className="label mt-1.5 !text-[0.625rem]">{label}</p>
    </div>
  );
}

export function PersonPage() {
  const { id = '' } = useParams();
  const person = usePerson(id);
  const [allRatings, setAllRatings] = useState(false);

  if (person.isPending) return <SkeletonRows rows={5} />;
  if (person.isError) return <ErrorState message={errorMessage(person.error)} onRetry={() => void person.refetch()} />;

  const p = person.data;
  const name = p.is_me ? 'You' : p.display_name;
  const current = p.collection.filter((o) => !o.sold_on);
  const past = p.collection.filter((o) => o.sold_on);
  const ratings = allRatings ? p.ratings : p.ratings.slice(0, RATINGS_SHOWN);

  return (
    <div className="space-y-6">
      <BackLink to="/people">People</BackLink>
      <header>
        <p className="label">Joined {formatDate(localToday(new Date(p.created_at)))}</p>
        <h1 className="display mt-1 text-[2.75rem] leading-[1.02] break-words">{p.display_name}</h1>
        <div className="mt-3 grid grid-cols-3 divide-x divide-line border-y border-line">
          <Stat value={String(p.ratings.length)} label="Rated" />
          <Stat value={p.avg_score === null ? '–' : p.avg_score.toFixed(1)} label="Avg score" />
          <Stat value={String(current.length)} label="Owns now" />
        </div>
      </header>

      <section aria-labelledby="p-ratings">
        <SectionTitle id="p-ratings">Ratings, best first</SectionTitle>
        {p.ratings.length === 0 ? (
          <p className="border-y border-line py-4 text-muted">{p.is_me ? 'You haven’t' : `${name} hasn’t`} rated anything yet.</p>
        ) : (
          <>
            <ul className="border-t border-line">
              {ratings.map((r) => (
                <WatchLine
                  key={r.id}
                  w={r}
                  watchId={r.watch_id}
                  detail={formatDate(r.rated_on, { short: true })}
                  extra={r.review_text ? <p className="mt-1 line-clamp-2 text-sm">“{r.review_text}”</p> : null}
                  right={
                    <span className="num w-10 shrink-0 text-right text-3xl text-accent" aria-label={`${r.score} out of 10`}>
                      {r.score}
                    </span>
                  }
                />
              ))}
            </ul>
            {!allRatings && p.ratings.length > RATINGS_SHOWN && (
              <Button kind="secondary" className="mt-3 w-full" onClick={() => setAllRatings(true)}>
                Show all {p.ratings.length}
              </Button>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="p-collection">
        <SectionTitle id="p-collection">Collection</SectionTitle>
        {p.collection.length === 0 ? (
          <p className="border-y border-line py-4 text-muted">Nothing in {p.is_me ? 'your' : 'their'} collection yet.</p>
        ) : (
          <ul className="border-t border-line">
            {[...current, ...past].map((o) => (
              <WatchLine
                key={o.id}
                w={o}
                watchId={o.watch_id}
                detail={
                  o.sold_on
                    ? `Sold ${formatDate(o.sold_on, { short: true })}`
                    : o.acquired_on
                      ? `Since ${formatDate(o.acquired_on, { short: true })}`
                      : undefined
                }
                right={o.sold_on ? <span className="label shrink-0 border border-line px-1.5 py-0.5 !text-[0.625rem]">Sold</span> : null}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="p-lists">
        <SectionTitle id="p-lists">Lists</SectionTitle>
        {p.lists.length === 0 ? (
          <p className="border-y border-line py-4 text-muted">No lists yet.</p>
        ) : (
          <ul className="border-t border-line">
            {p.lists.map((l) => (
              <li key={l.id}>
                <Link to={`/lists/${l.id}`} className="flex min-h-14 items-center gap-3 border-b border-line py-2">
                  <span className="hero grid size-11 shrink-0 place-items-center text-ink">
                    <ListGlyph />
                  </span>
                  <span className="display min-w-0 flex-1 truncate text-xl">{l.name}</span>
                  <span className="mono shrink-0 text-xs text-muted">{plural(l.item_count, 'watch', 'watches')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
