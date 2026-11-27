import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { CommunityRating, Ownership, RatingEntry, WatchDetail, WatchOwner } from '../../shared/types';
import { WatchArt, WatchImage } from '../components/WatchArt';
import { AddToListSheet } from '../components/ListSheets';
import { OwnershipSheet } from '../components/OwnershipSheet';
import { PhotoGallery, PhotoPicker, type PhotoPickerHandle } from '../components/Photos';
import { RatingSheet } from '../components/RatingSheet';
import { WatchName } from '../components/WatchItems';
import { Sheet } from '../components/Sheet';
import { Button, EmptyState, ErrorState, ScoreBadge, SectionTitle, SkeletonRows } from '../components/ui';
import { errorMessage } from '../lib/api';
import { useMe } from '../lib/auth';
import { formatDate, localToday, plural, watchTitle } from '../lib/format';
import { useCommunityRatings, useOwners, usePersonEntries, usePhotos, useWatch } from '../lib/queries';

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
  const [owning, setOwning] = useState<{ open: boolean; ownership: Ownership | null }>({ open: false, ownership: null });
  const owners = useOwners(id);
  const [listing, setListing] = useState(false);
  const photos = usePhotos(id);
  const picker = useRef<PhotoPickerHandle>(null);
  const [shownPhotoId, setShownPhotoId] = useState<string | null>(null);

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

  const nickname = typeof w.extras?.nickname === 'string' && w.extras.nickname ? w.extras.nickname : null;
  // The hero shows the photo picked in the gallery, else the primary (oldest) photo, else the drawing.
  const shown = photos.data?.find((p) => p.id === shownPhotoId) ?? null;
  const heroUrl = shown?.url ?? w.primary_image_url ?? null;

  return (
    <article className="space-y-5">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex min-h-11 items-center font-semibold text-accent">
            ‹ Home
          </Link>
          <Link to={`/watch/${w.watch_id}/edit`} className="inline-flex min-h-11 items-center font-semibold text-muted">
            Edit details
          </Link>
        </div>
        {/* The uploaded photo when there is one (Phase 2), otherwise a drawing from the watch's data */}
        <div className="hero relative grid h-64 place-items-center overflow-hidden border border-line">
          {heroUrl ? (
            <WatchImage watch={w} photoUrl={heroUrl} className="h-full w-full" />
          ) : (
            <>
              <WatchArt watch={w} className="h-[84%] w-auto" />
              <p className="label absolute bottom-2.5 left-3 !text-[0.625rem]">Drawn from specs</p>
            </>
          )}
        </div>
        <div>
          <p className="label">{w.brand_name}</p>
          <h1 className="display mt-1 text-[2.5rem]">{w.model_name}</h1>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {nickname && <span className="font-semibold text-accent">“{nickname}”</span>}
            <span className={t.hasReference ? 'mono text-sm text-muted' : 'text-sm text-muted italic'}>
              {t.hasReference ? w.reference : 'reference not specified'}
            </span>
          </p>
        </div>
      </header>

      <section aria-label="Community score" className="flex items-end justify-between gap-4 border-y border-line py-4">
        <div>
          <p className="label">Community score</p>
          <p className="mt-1.5 text-sm text-muted">
            {w.rating_count === 0 ? 'No ratings yet' : plural(w.rating_count, 'rating')}
            {mine && <> · yours: {mine.score}</>}
          </p>
        </div>
        <p className="flex items-baseline gap-1">
          <span className="num text-[4rem] text-accent">{w.avg_score === null ? '–' : w.avg_score.toFixed(1)}</span>
          <span className="mono text-sm text-muted">/10</span>
        </p>
      </section>

      <div role="group" aria-label="More actions" className="grid grid-flow-col auto-cols-fr divide-x divide-line border border-line">
        <ActionButton onClick={() => setOwning({ open: true, ownership: null })}>I own this</ActionButton>
        <ActionButton onClick={() => setListing(true)}>Add to list</ActionButton>
        <ActionButton onClick={() => picker.current?.pick()}>Add photo</ActionButton>
      </div>

      {photos.data && photos.data.length > 0 && (
        <PhotoGallery photos={photos.data} meId={me.id} selectedId={shown?.id ?? null} onSelect={(p) => setShownPhotoId(p.id)} />
      )}

      <section aria-labelledby="specs-title">
        <SectionTitle id="specs-title">Specs</SectionTitle>
        {specs.length === 0 ? (
          <p className="border-y border-line py-4 text-muted">No specs yet. Anyone can add them.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 border-t border-line">
            {specs.map(([k, v]) => (
              <div key={k} className="min-w-0 border-b border-line py-2.5">
                <dt className="label !text-[0.625rem]">{k}</dt>
                <dd className="mt-1 text-[0.9375rem] font-medium break-words">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="mt-2 text-xs text-muted">
          Added by {w.created_by === me.id ? 'you' : w.created_by_name}
          {w.updated_at && (
            <>
              {' '}
              · edited by {w.updated_by_name ?? 'someone'} {formatDate(localToday(new Date(w.updated_at)), { short: true })}
            </>
          )}
        </p>
      </section>

      <Owners
        query={owners}
        meId={me.id}
        onEdit={(o) => setOwning({ open: true, ownership: o })}
      />

      <section aria-labelledby="ratings-title">
        <SectionTitle id="ratings-title">Ratings</SectionTitle>
        {ratings.isPending ? (
          <SkeletonRows rows={3} />
        ) : ratings.isError ? (
          <ErrorState message={errorMessage(ratings.error)} onRetry={() => void ratings.refetch()} />
        ) : ratings.data.length === 0 ? (
          <EmptyState title="Nobody has rated this yet. Be the first." />
        ) : (
          <ul className="border-t border-line">
            {ratings.data.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setPerson(r)}
                  className="flex w-full items-start gap-3 border-b border-line py-3 text-left"
                  aria-label={`${r.user_id === me.id ? 'You' : r.display_name}: ${r.score} out of 10. Show all entries`}
                >
                  <ScoreBadge score={r.score} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className="font-semibold">{r.user_id === me.id ? 'You' : r.display_name}</span>
                      <span className="mono text-xs text-muted">{formatDate(r.rated_on, { short: true })}</span>
                    </p>
                    {r.review_text && <p className="mt-1 whitespace-pre-line text-[0.9375rem]">{r.review_text}</p>}
                    {r.entry_count > 1 && (
                      <p className="mt-1 text-sm font-semibold text-accent">{plural(r.entry_count, 'entry', 'entries')}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rate bar pinned above the tab bar */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-bg px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <Button className="w-full" onClick={() => setRating({ open: true, entry: null })}>
            {mine ? 'Rate again' : 'Rate this watch'}
          </Button>
        </div>
      </div>
      <div className="h-20" aria-hidden="true" />

      <RatingSheet
        open={rating.open}
        onClose={() => setRating({ open: false, entry: null })}
        watchId={w.watch_id}
        watchTitle={t.title}
        watch={w}
        latest={mine}
        entry={rating.entry}
      />
      <OwnershipSheet
        open={owning.open}
        onClose={() => setOwning({ open: false, ownership: null })}
        watchId={w.watch_id}
        ownership={owning.ownership}
        title={<WatchName w={w} />}
      />
      <PhotoPicker ref={picker} watchId={w.watch_id} title={<WatchName w={w} />} />
      <AddToListSheet open={listing} onClose={() => setListing(false)} watchId={w.watch_id} title={<WatchName w={w} />} />
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
                <p className="mono text-xs text-muted">{formatDate(e.rated_on)}</p>
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

/** Secondary watch-page action: outlined condensed capitals in a ruled row. */
function ActionButton({ children, onClick }: { children: ReactNode; onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="display flex min-h-12 items-center justify-center px-2 text-center text-[1.0625rem] leading-none tracking-[0.06em] text-ink"
    >
      {children}
    </button>
  );
}

function Owners({
  query,
  meId,
  onEdit,
}: {
  query: ReturnType<typeof useOwners>;
  meId: string;
  onEdit(o: WatchOwner): void;
}) {
  return (
    <section aria-labelledby="owners-title">
      <SectionTitle id="owners-title">Owners</SectionTitle>
      {query.isPending ? (
        <SkeletonRows rows={1} />
      ) : query.isError ? (
        <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <p className="border-y border-line py-3 text-muted">Nobody has this in their collection yet.</p>
      ) : (
        <ul className="border-t border-line">
          {query.data.map((o) => {
            const mine = o.user_id === meId;
            const who = mine ? 'You' : o.display_name;
            const detail = o.sold_on
              ? `Sold ${formatDate(o.sold_on, { short: true })}`
              : o.acquired_on
                ? `Since ${formatDate(o.acquired_on, { short: true })}`
                : '';
            const body = (
              <>
                <span className="font-semibold">{who}</span>
                <span className="flex items-center gap-2">
                  {detail && <span className="mono text-xs text-muted">{detail}</span>}
                  {o.sold_on && <span className="label border border-line px-1.5 py-0.5 !text-[0.625rem]">Sold</span>}
                  {mine && <span className="text-sm font-semibold text-accent">Edit</span>}
                </span>
              </>
            );
            const cls = `flex min-h-11 w-full items-center justify-between gap-3 border-b border-line py-2 text-left ${o.sold_on ? 'opacity-70' : ''}`;
            return (
              <li key={o.id}>
                {mine ? (
                  <button type="button" className={cls} onClick={() => onEdit(o)} aria-label={`Your ownership${detail ? `, ${detail}` : ''}. Edit`}>
                    {body}
                  </button>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
