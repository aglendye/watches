import { Link } from 'react-router-dom';
import type { CatalogWatch, FeedItem as Feed, SearchResult } from '../../shared/types';
import { plural, relativeTime, watchTitle } from '../lib/format';
import { DialReadOnly } from './DialReadOnly';

export function WatchRow({ w }: { w: SearchResult }) {
  const t = watchTitle(w);
  return (
    <Link
      to={`/watch/${w.watch_id}`}
      className="flex min-h-16 items-center gap-3 rounded-card border border-line bg-surface px-3 py-2"
    >
      <DialReadOnly avg={w.avg_score} className="w-12" showNumbers={false} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 leading-snug font-semibold">{t.title}</p>
        <p className={`truncate text-sm ${t.hasReference ? 'tabular text-ink' : 'text-muted italic'}`}>
          {t.hasReference ? t.subtitle : 'reference not specified'}
          {w.nickname && <span className="text-muted not-italic"> · “{w.nickname}”</span>}
        </p>
      </div>
      <div className="shrink-0 text-right text-sm text-muted">
        {w.rating_count === 0 ? 'No ratings' : plural(w.rating_count, 'rating')}
      </div>
    </Link>
  );
}

export function WatchCard({ w }: { w: CatalogWatch }) {
  const t = watchTitle(w);
  return (
    <Link
      to={`/watch/${w.watch_id}`}
      className="flex w-40 shrink-0 snap-start flex-col gap-2 rounded-card border border-line bg-surface p-3"
    >
      <DialReadOnly avg={w.avg_score} className="mx-auto w-20" showNumbers={false} />
      <div className="min-w-0">
        <p className="label truncate !text-[0.7rem]">{w.brand_name}</p>
        <p className="line-clamp-2 leading-snug font-semibold">{w.model_name}</p>
        <p className="mt-0.5 truncate text-sm text-muted">
          {w.avg_score === null ? 'Not rated yet' : `${w.avg_score.toFixed(1)} avg`}
        </p>
      </div>
      <span className="sr-only">{t.subtitle}</span>
    </Link>
  );
}

export function FeedItem({ item, meId }: { item: Feed; meId: string }) {
  const who = item.user_id === meId ? 'You' : item.display_name;
  const watch = `${item.brand_name} ${item.model_name}`;
  const snippet =
    item.snippet && item.snippet.length > 140 ? item.snippet.slice(0, 140).trimEnd() + '…' : item.snippet;
  return (
    <li>
      <Link to={`/watch/${item.watch_id}`} className="block min-h-11 rounded-card px-1 py-3">
        <div className="flex items-start gap-3">
          <span
            className={`tabular mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
              item.kind === 'rating' ? 'border-2 border-accent text-accent' : 'bg-surface-2 text-muted'
            }`}
            aria-hidden="true"
          >
            {item.kind === 'rating' ? item.score : '+'}
          </span>
          <div className="min-w-0 flex-1">
            <p>
              <span className="font-semibold">{who}</span>{' '}
              {item.kind === 'rating' ? (
                <>
                  rated <span className="font-semibold">{watch}</span> <span className="tabular">{item.score}/10</span>
                </>
              ) : (
                <>
                  added <span className="font-semibold">{watch}</span>
                </>
              )}
            </p>
            {snippet && <p className="mt-1 line-clamp-2 text-sm text-muted">“{snippet}”</p>}
            <p className="mt-1 text-xs text-muted">
              <time dateTime={item.created_at}>{relativeTime(item.created_at)}</time>
            </p>
          </div>
        </div>
      </Link>
    </li>
  );
}
