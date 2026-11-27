import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { CommunityRating, RatingEntry, WatchDetail } from '../../shared/types';
import { DialReadOnly } from '../components/DialReadOnly';
import { WatchArt, WatchImage } from '../components/WatchArt';
import { RatingSheet } from '../components/RatingSheet';
import { Sheet } from '../components/Sheet';
import { Button, Card, EmptyState, ErrorState, ScoreBadge, SectionTitle, SkeletonRows } from '../components/ui';
import { errorMessage } from '../lib/api';
import { useMe } from '../lib/auth';
import { formatDate, localToday, plural, watchTitle } from '../lib/format';
import { useCommunityRatings, usePersonEntries, useWatch } from '../lib/queries';

const EXTRA_LABELS: Record<string, string> = {
  caliber: 'Caliber',
  bezel: 'Bezel',
  bracelet: 'Bracelet / strap',
  production_end: 'Discontinued',
};

const MOVEMENT: Record<string, string> = { automatic: 'Automatic', manual: 'Manual wind', quartz: 'Quartz', other: 'Other' };

function specRows(w: WatchDetail): [string, string][] {
  const rows: [string, string][] = [];
  if (w.case_size_mm !== null) rows.push(['Case size', `${w.case_size_mm} mm`]);
  if (w.movement_type) rows.push(['Movement', MOVEMENT[w.movement_type] ?? w.movement_type]);
  if (w.case_material) rows.push(['Case material', w.case_material]);
  if (w.dial_color) rows.push(['Dial color', w.dial_color]);
  if (w.water_resistance_m !== null) rows.push(['Water resistance', `${w.water_resistance_m} m`]);
  if (w.year_introduced !== null) rows.push(['Introduced', String(w.year_introduced)]);
  for (const [k, v] of Object.entries(w.extras ?? {})) {
    if (k === 'nickname' || v === null || v === '') continue;
    rows.push([EXTRA_LABELS[k] ?? k, String(v)]);
  }
  return rows;
}

export function Watch() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const me = useMe();
  const watch = useWatch(id);
  const ratings = useCommunityRatings(id);

  const [rating, setRating] = useState<{ open: boolean; entry: RatingEntry | null }>({ open: false, entry: null });
  const [person, setPerson] = useState<CommunityRating | null>(null);

  // ?rate=1 opens the rating sheet once, then is removed from the URL.
  useEffect(() => {
    if (params.get('rate') === '1') {
      setRating({ open: true, entry: null });
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  if (watch.isPending) return <SkeletonRows rows={5} />;
  if (watch.isError)
    return <ErrorState message={errorMessage(watch.error)} onRetry={() => void watch.refetch()} />;

  const w = watch.data;
  const t = watchTitle(w);
  const mine = ratings.data?.find((r) => r.user_id === me.id) ?? null;
  const specs = specRows(w);

  return (
    <article className="space-y-6">
      <header className="space-y-4">
        <Link to="/" className="inline-flex min-h-11 items-center font-medium text-accent">
          ‹ Home
        </Link>
        {/* The uploaded photo when there is one (Phase 2), otherwise a drawing from the watch's data */}
        <div className="grid aspect-[16/9] place-items-center overflow-hidden hero rounded-card border border-line">
          {w.primary_image_url ? (
            <WatchImage watch={w} photoUrl={w.primary_image_url} className="h-full w-full" />
          ) : (
            <WatchArt watch={w} className="h-[88%] w-auto" />
          )}
        </div>
        <div>
          <p className="label">{w.brand_name}</p>
          <h1 className="display text-4xl">{w.model_name}</h1>
          <p className={`mt-1 ${t.hasReference ? 'tabular' : 'text-muted italic'}`}>{t.subtitle}</p>
          {typeof w.extras?.nickname === 'string' && w.extras.nickname && (
            <p className="mt-1 text-lg font-medium text-gold">“{w.extras.nickname}”</p>
          )}
        </div>
      </header>

      <Card className="flex items-center gap-4 p-4">
        <DialReadOnly avg={w.avg_score} className="w-32" watch={w} />
        <div>
          <p className="label">Community score</p>
          {w.rating_count === 0 ? (
            <p className="mt-1 text-lg font-semibold">No ratings yet</p>
          ) : (
            <p className="tabular mt-1 text-lg">
              <span className="serif text-3xl">{w.avg_score?.toFixed(1)}</span> from{' '}
              {plural(w.rating_count, 'person', 'people')}
            </p>
          )}
          {mine && (
            <p className="mt-1 text-sm text-muted">
              You: {mine.score}/10 on {formatDate(mine.rated_on, { short: true })}
            </p>
          )}
        </div>
      </Card>

      <section aria-labelledby="specs-title">
        <details open className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between">
            <SectionTitle id="specs-title">Specs</SectionTitle>
            <span className="text-sm text-muted group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <Card className="px-4">
            {specs.length === 0 ? (
              <p className="py-4 text-muted">No specs yet. Anyone can add them.</p>
            ) : (
              <dl className="divide-y divide-line">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-muted">
              Added by {w.created_by === me.id ? 'you' : w.created_by_name}
              {w.updated_at && (
                <>
                  {' '}
                  · edited by {w.updated_by_name ?? 'someone'} {formatDate(localToday(new Date(w.updated_at)), { short: true })}
                </>
              )}
            </p>
            <Link to={`/watch/${w.watch_id}/edit`} className="inline-flex min-h-11 shrink-0 items-center font-medium text-accent">
              Edit details
            </Link>
          </div>
        </details>
      </section>

      <section aria-labelledby="ratings-title">
        <SectionTitle id="ratings-title">Ratings</SectionTitle>
        {ratings.isPending ? (
          <SkeletonRows rows={3} />
        ) : ratings.isError ? (
          <ErrorState message={errorMessage(ratings.error)} onRetry={() => void ratings.refetch()} />
        ) : ratings.data.length === 0 ? (
          <EmptyState title="Nobody has rated this yet. Be the first." />
        ) : (
          <ul className="space-y-2">
            {ratings.data.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setPerson(r)}
                  className="flex w-full items-start gap-3 rounded-card border border-line bg-surface p-3 text-left"
                  aria-label={`${r.user_id === me.id ? 'You' : r.display_name}: ${r.score} out of 10. Show all entries`}
                >
                  <ScoreBadge score={r.score} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className="font-semibold">{r.user_id === me.id ? 'You' : r.display_name}</span>
                      <span className="text-sm text-muted">{formatDate(r.rated_on, { short: true })}</span>
                    </p>
                    {r.review_text && <p className="mt-1 whitespace-pre-line">{r.review_text}</p>}
                    {r.entry_count > 1 && (
                      <p className="mt-1 text-sm text-accent">{plural(r.entry_count, 'entry', 'entries')}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sticky Rate button above the tab bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 px-4 pb-3">
        <div className="mx-auto max-w-2xl">
          <Button className="pointer-events-auto w-full shadow-lg" onClick={() => setRating({ open: true, entry: null })}>
            {mine ? 'Rate again' : 'Rate'}
          </Button>
        </div>
      </div>
      <div className="h-16" aria-hidden="true" />

      <RatingSheet
        open={rating.open}
        onClose={() => setRating({ open: false, entry: null })}
        watchId={w.watch_id}
        watchTitle={t.title}
        watch={w}
        latest={mine}
        entry={rating.entry}
      />
      <PersonEntries
        watchId={w.watch_id}
        person={person}
        isMe={person?.user_id === me.id}
        onClose={() => setPerson(null)}
        onEdit={(entry) => {
          setPerson(null);
          setRating({ open: true, entry });
        }}
      />
    </article>
  );
}

function PersonEntries({
  watchId,
  person,
  isMe,
  onClose,
  onEdit,
}: {
  watchId: string;
  person: CommunityRating | null;
  isMe: boolean;
  onClose(): void;
  onEdit(e: RatingEntry): void;
}) {
  const entries = usePersonEntries(watchId, person?.user_id ?? null);
  return (
    <Sheet open={!!person} onClose={onClose} title={isMe ? 'Your entries' : `${person?.display_name ?? ''}’s entries`}>
      {entries.isPending ? (
        <SkeletonRows rows={2} />
      ) : entries.isError ? (
        <ErrorState message={errorMessage(entries.error)} onRetry={() => void entries.refetch()} />
      ) : (
        <ul className="divide-y divide-line">
          {entries.data.map((e) => (
            <li key={e.id} className="flex items-start gap-3 py-3">
              <ScoreBadge score={e.score} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">{formatDate(e.rated_on)}</p>
                {e.review_text && <p className="mt-1 whitespace-pre-line">{e.review_text}</p>}
              </div>
              {isMe && (
                <Button kind="ghost" onClick={() => onEdit(e)} aria-label={`Edit entry from ${formatDate(e.rated_on)}`}>
                  Edit
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
