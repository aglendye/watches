import { Link } from 'react-router-dom';
import type { CatalogWatch, FeedItem as Feed, SearchResult } from '../../shared/types';
import { plural, relativeTime, watchTitle } from '../lib/format';
import { WatchImage } from './WatchArt';

const nick = (x: unknown) => (typeof x === 'string' && x ? x : null);

export function WatchRow({ w }: { w: SearchResult }) {
  const t = watchTitle(w);
  return (
    <Link to={`/watch/${w.watch_id}`} className="flex min-h-16 items-center gap-3 border-b border-line py-2.5">
      <div className="hero grid size-14 shrink-0 place-items-center">
        <WatchImage watch={{ ...w, reference: w.watch_reference }} photoUrl={w.primary_image_url} className="size-12" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="label !text-[0.625rem]">{w.brand_name}</p>
        <p className="display line-clamp-2 text-xl leading-[1.05]">{w.model_name}</p>
        <p className="mt-0.5 flex min-w-0 items-baseline gap-2 text-sm">
          {w.nickname && <span className="shrink-0 font-semibold text-accent">“{w.nickname}”</span>}
          <span className={`truncate ${t.hasReference ? 'mono text-xs text-muted' : 'text-xs text-muted italic'}`}>
            {t.hasReference ? w.watch_reference : 'reference not specified'}
          </span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        {w.avg_score !== null ? (
          <p className="num text-3xl text-accent">{w.avg_score.toFixed(1)}</p>
        ) : (
          <p className="label !text-[0.625rem]">Unrated</p>
        )}
        {w.rating_count > 0 && <p className="mono mt-1 text-[0.6875rem] text-muted">{plural(w.rating_count, 'rating')}</p>}
      </div>
    </Link>
  );
}

export function WatchCard({ w }: { w: CatalogWatch }) {
  const t = watchTitle(w);
  const nickname = nick(w.extras?.nickname);
  return (
    <Link
      to={`/watch/${w.watch_id}`}
      className="relative flex w-[9.5rem] shrink-0 snap-start flex-col overflow-hidden border border-line bg-surface"
    >
      <div className="hero grid h-[8.125rem] place-items-center border-b border-line">
        <WatchImage watch={w} photoUrl={w.primary_image_url} className="size-[6.5rem]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 pt-2.5 pb-3">
        <p className="label truncate !text-[0.625rem]">{w.brand_name}</p>
        <p className="display line-clamp-2 text-lg leading-[1.05]">{w.model_name}</p>
        {nickname && <p className="truncate text-[0.8125rem] font-semibold text-accent">“{nickname}”</p>}
        <p className="mono mt-auto truncate pt-1 text-[0.6875rem] text-muted">
          {w.avg_score === null ? 'Not rated yet' : `${w.avg_score.toFixed(1)} avg`}
        </p>
      </div>
      <span className="sr-only">{t.subtitle}</span>
    </Link>
  );
}

export function FeedItem({ item, meId }: { item: Feed; meId: string }) {
  const who = item.user_id === meId ? 'You' : item.display_name;
  const nickname = nick(item.extras?.nickname);
  const name = nickname ? `the ${nickname}` : `${item.brand_name} ${item.model_name}`;
  const snippet =
    item.snippet && item.snippet.length > 140 ? item.snippet.slice(0, 140).trimEnd() + '…' : item.snippet;
  const art = { brand_name: item.brand_name, model_name: item.model_name, reference: item.reference, case_material: item.case_material, dial_color: item.dial_color, extras: item.extras };
  return (
    <li>
      <Link to={`/watch/${item.watch_id}`} className="flex min-h-11 items-center gap-3 border-b border-line py-2.5">
        <div className="hero grid size-12 shrink-0 place-items-center">
          <WatchImage watch={art} className="size-10" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] leading-snug">
            <span className="font-semibold">{who}</span> {item.kind === 'rating' ? 'rated' : 'added'} {name}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {nickname ? `${item.model_name} · ` : ''}
            <time dateTime={item.created_at}>{relativeTime(item.created_at)}</time>
          </p>
          {snippet && <p className="mt-1 line-clamp-2 text-sm text-muted">“{snippet}”</p>}
        </div>
        {item.kind === 'rating' ? (
          <span className="num w-9 shrink-0 text-right text-3xl text-accent" aria-label={`${item.score} out of 10`}>
            {item.score}
          </span>
        ) : (
          <span className="label shrink-0 !text-[0.625rem]">New</span>
        )}
      </Link>
    </li>
  );
}

/** "Brand Model" with the nickname in orange: for sheet titles. */
export function WatchName({ w }: { w: { brand_name: string; model_name: string; extras?: Record<string, unknown> | null } }) {
  const nickname = nick(w.extras?.nickname);
  return (
    <>
      {w.brand_name} {w.model_name}
      {nickname && <span className="text-accent"> “{nickname}”</span>}
    </>
  );
}
