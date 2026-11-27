// Browse the catalog without typing: brands -> models -> references.
// Lists get a filter box once they're long (a big Rolex batch can put dozens
// of references under one model).
import { useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WatchImage } from '../components/WatchArt';
import { BackLink, EmptyState, ErrorState, SectionTitle, SkeletonRows } from '../components/ui';
import { errorMessage } from '../lib/api';
import { plural } from '../lib/format';
import { useBrand, useBrands, useModel } from '../lib/queries';
import type { ModelDetail } from '../../shared/types';

const FILTER_FROM = 12;

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function FilterBox({ value, onChange, label }: { value: string; onChange(v: string): void; label: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={label}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        className="min-h-12 w-full border border-line bg-surface px-3 text-base text-ink placeholder:text-muted"
      />
    </div>
  );
}

export function Brands() {
  const brands = useBrands();
  const [filter, setFilter] = useState('');
  const shown = brands.data?.filter((b) => norm(b.name).includes(norm(filter))) ?? [];
  const total = brands.data?.reduce((n, b) => n + b.watch_count, 0) ?? 0;

  return (
    <div className="space-y-5">
      <BackLink to="/">Home</BackLink>
      <div>
        <h1 className="display text-[2.75rem]">Browse</h1>
        {brands.data && (
          <p className="mono text-sm text-muted">
            {plural(total, 'watch', 'watches')} · {plural(brands.data.length, 'brand')}
          </p>
        )}
      </div>
      {brands.isPending ? (
        <SkeletonRows rows={6} />
      ) : brands.isError ? (
        <ErrorState message={errorMessage(brands.error)} onRetry={() => void brands.refetch()} />
      ) : brands.data.length === 0 ? (
        <EmptyState
          title="The catalog is empty. Add the first watch."
          action={
            <Link to="/add" className="display inline-flex min-h-12 items-center bg-accent px-5 text-lg tracking-[0.06em] text-on-accent">
              Add a watch
            </Link>
          }
        />
      ) : (
        <>
          {brands.data.length >= FILTER_FROM && <FilterBox value={filter} onChange={setFilter} label="Filter brands" />}
          <ul className="border-t border-line">
            {shown.map((b) => (
              <li key={b.id}>
                <Link to={`/browse/${b.id}`} className="flex min-h-14 items-center justify-between gap-3 border-b border-line py-2">
                  <span className="display min-w-0 truncate text-2xl">{b.name}</span>
                  <span className="flex shrink-0 items-center gap-3 text-muted">
                    <span className="mono text-xs">{plural(b.watch_count, 'watch', 'watches')}</span>
                    <span aria-hidden="true" className="text-2xl">
                      ›
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {shown.length === 0 && <p className="text-muted">No brand matches “{filter}”.</p>}
        </>
      )}
    </div>
  );
}

export function BrandPage() {
  const { brandId = '' } = useParams();
  const brand = useBrand(brandId);
  const [filter, setFilter] = useState('');

  if (brand.isPending) return <SkeletonRows rows={6} />;
  if (brand.isError) return <ErrorState message={errorMessage(brand.error)} onRetry={() => void brand.refetch()} />;

  const b = brand.data;
  const models = b.models.filter((m) => norm(m.name).includes(norm(filter)));
  const watches = b.models.reduce((n, m) => n + m.watch_count, 0);

  return (
    <div className="space-y-5">
      <BackLink to="/browse">Browse</BackLink>
      <div>
        <h1 className="display text-[2.75rem] leading-[1.02] break-words">{b.name}</h1>
        <p className="mono text-sm text-muted">
          {plural(b.models.length, 'model')} · {plural(watches, 'watch', 'watches')}
        </p>
      </div>
      {b.models.length >= FILTER_FROM && <FilterBox value={filter} onChange={setFilter} label={`Filter ${b.name} models`} />}
      <SectionTitle>Models</SectionTitle>
      <ul className="-mt-3 border-t border-line">
        {models.map((m) => {
          // A model with one reference goes straight to the watch.
          const to = m.watch_count === 1 ? `/watch/${m.sample_watch_id}` : `/browse/${b.id}/${m.id}`;
          return (
            <li key={m.id}>
              <Link to={to} className="flex min-h-16 items-center gap-3 border-b border-line py-2">
                <div className="hero grid size-14 shrink-0 place-items-center">
                  {m.sample && <WatchImage watch={m.sample} photoUrl={m.sample.primary_image_url} className="size-12" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="display line-clamp-2 text-xl leading-[1.05]">{m.name}</p>
                  <p className="mono mt-0.5 text-xs text-muted">
                    {m.watch_count === 1 ? '1 reference' : plural(m.watch_count, 'reference')}
                    {m.rating_count > 0 && <> · {plural(m.rating_count, 'rating')}</>}
                  </p>
                </div>
                <span aria-hidden="true" className="text-2xl text-muted">
                  ›
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {models.length === 0 && <p className="text-muted">No model matches “{filter}”.</p>}
    </div>
  );
}

/** A reference within a model page: brand and model are already in the heading. */
function ReferenceRow({ w }: { w: ModelDetail['watches'][number] }) {
  const facts = [
    w.case_size_mm !== null ? `${w.case_size_mm} mm` : null,
    w.case_material,
    w.dial_color ? `${w.dial_color} dial` : null,
    w.year_introduced ? String(w.year_introduced) : null,
  ].filter(Boolean);
  return (
    <li>
      <Link to={`/watch/${w.watch_id}`} className="flex min-h-16 items-center gap-3 border-b border-line py-2.5">
        <div className="hero grid size-14 shrink-0 place-items-center">
          <WatchImage watch={{ ...w, reference: w.watch_reference }} photoUrl={w.primary_image_url} className="size-12" />
        </div>
        <div className="min-w-0 flex-1">
          {w.nickname && <p className="display truncate text-xl leading-[1.05] text-accent">{w.nickname}</p>}
          <p className={w.nickname ? 'mono text-sm' : 'display text-xl leading-[1.05]'}>{w.watch_reference ?? 'Reference not specified'}</p>
          {facts.length > 0 && <p className="mt-0.5 truncate text-xs text-muted">{facts.join(' · ')}</p>}
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
    </li>
  );
}

export function ModelPage() {
  const { brandId = '', modelId = '' } = useParams();
  const model = useModel(modelId);
  const [filter, setFilter] = useState('');

  if (model.isPending) return <SkeletonRows rows={6} />;
  if (model.isError) return <ErrorState message={errorMessage(model.error)} onRetry={() => void model.refetch()} />;

  const m = model.data;
  const f = norm(filter);
  const watches = m.watches.filter(
    (w) =>
      !f ||
      norm([w.watch_reference, w.nickname, w.dial_color, w.case_material, w.extras?.aka, w.year_introduced].filter(Boolean).join(' ')).includes(f),
  );

  return (
    <div className="space-y-5">
      <BackLink to={`/browse/${brandId || m.brand_id}`}>{m.brand_name}</BackLink>
      <div>
        <p className="label">{m.brand_name}</p>
        <h1 className="display mt-1 text-[2.5rem] leading-[1.02] break-words">{m.name}</h1>
        <p className="mono text-sm text-muted">{plural(m.watches.length, 'reference')}, newest first</p>
      </div>
      {m.watches.length >= FILTER_FROM && (
        <FilterBox value={filter} onChange={setFilter} label="Filter by reference, nickname, dial, metal" />
      )}
      <ul className="border-t border-line">
        {watches.map((w) => (
          <ReferenceRow key={w.watch_id} w={w} />
        ))}
      </ul>
      {watches.length === 0 && <p className="text-muted">Nothing matches “{filter}”.</p>}
    </div>
  );
}
