import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SearchBox } from '../components/SearchBox';
import { WatchRow } from '../components/WatchItems';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui';
import { errorMessage } from '../lib/api';
import { useSearch } from '../lib/queries';

/**
 * Shared by Home (#/) and Search results (#/search?q=). Keeping one search
 * field across both routes means the iPhone keyboard stays open when typing
 * on Home jumps to the results.
 */
export function SearchLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onResults = location.pathname === '/search';
  const urlQ = onResults ? params.get('q') ?? '' : '';
  const [value, setValue] = useState(urlQ);
  const lastPushed = useRef(urlQ);

  // Follow the URL when it changes from outside (back button, links).
  useEffect(() => {
    if (urlQ !== lastPushed.current) {
      setValue(urlQ);
      lastPushed.current = urlQ;
    }
  }, [urlQ]);

  function go(q: string, immediate: boolean) {
    const trimmed = q.trim();
    if (!onResults && trimmed.length < (immediate ? 1 : 2)) return;
    lastPushed.current = q;
    navigate(`/search?q=${encodeURIComponent(q)}`, { replace: onResults });
  }

  // Debounce typing by 250 ms.
  useEffect(() => {
    if (value === urlQ) return;
    const t = setTimeout(() => go(value, false), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 bg-bg/95 px-4 pt-[env(safe-area-inset-top)] pb-3 backdrop-blur">
        <h1 className="sr-only">{onResults ? 'Search results' : 'Home'}</h1>
        <SearchBox value={value} onChange={setValue} onSubmit={(v) => go(v, true)} />
      </div>
      <Outlet />
    </div>
  );
}

export function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const trimmed = q.trim();
  const search = useSearch(q);

  const addLink = (
    <Link
      to={`/add?q=${encodeURIComponent(trimmed)}`}
      className="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-accent px-4 font-semibold text-accent"
    >
      Can’t find it? Add it
    </Link>
  );

  if (!trimmed) {
    return <EmptyState title="Type a brand, model, or reference number." />;
  }

  return (
    <section aria-label="Results" className="space-y-3">
      {addLink}
      {search.isPending ? (
        <SkeletonRows label="Searching" />
      ) : search.isError ? (
        <ErrorState message={errorMessage(search.error)} onRetry={() => void search.refetch()} />
      ) : search.data.length === 0 ? (
        <EmptyState title={`No watches match “${trimmed}”. Add it so others can rate it too.`} />
      ) : (
        <>
          <p className="sr-only" role="status">
            {search.data.length} results
          </p>
          <ul className="space-y-2">
            {search.data.map((w) => (
              <li key={w.watch_id}>
                <WatchRow w={w} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
