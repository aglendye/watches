import { Link } from 'react-router-dom';
import { FeedItem, WatchCard } from '../components/WatchItems';
import { EmptyState, ErrorState, SectionTitle, SkeletonRows } from '../components/ui';
import { errorMessage } from '../lib/api';
import { useMe } from '../lib/auth';
import { useFeed, useRecent } from '../lib/queries';

export function Home() {
  const me = useMe();
  const feed = useFeed();
  const recent = useRecent();

  return (
    <div className="space-y-7 pt-2">
      <Link
        to="/browse"
        className="-mt-2 flex min-h-12 items-center justify-between border-b border-line text-muted"
      >
        <span className="label">Browse by brand</span>
        <span aria-hidden="true" className="text-xl">
          ›
        </span>
      </Link>
      {!(recent.isSuccess && recent.data.length === 0) && (
        <section aria-labelledby="recent-title">
          <SectionTitle id="recent-title">Recently added</SectionTitle>
          {recent.isPending ? (
            <div className="flex gap-3 overflow-hidden" role="status" aria-label="Loading">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-52 w-[9.5rem] shrink-0" />
              ))}
            </div>
          ) : recent.isError ? (
            <ErrorState message={errorMessage(recent.error)} onRetry={() => void recent.refetch()} />
          ) : (
            <ul className="scrollbar-none relative -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {recent.data.map((w) => (
                <li key={w.watch_id} className="flex">
                  <WatchCard w={w} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="feed-title">
        <SectionTitle id="feed-title">Recent activity</SectionTitle>
        {feed.isPending ? (
          <SkeletonRows rows={5} />
        ) : feed.isError ? (
          <ErrorState message={errorMessage(feed.error)} onRetry={() => void feed.refetch()} />
        ) : feed.data.length === 0 ? (
          <EmptyState
            title="No activity yet. Search for a watch you know (try “Batman” or “Speedmaster”) and give it a rating."
            action={
              <Link
                to="/browse"
                className="display inline-flex min-h-12 items-center bg-accent px-5 text-lg tracking-[0.06em] text-on-accent"
              >
                Browse the catalog
              </Link>
            }
          />
        ) : (
          <ul className="border-t border-line">
            {feed.data.map((item) => (
              <FeedItem key={`${item.kind}-${item.id}`} item={item} meId={me.id} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
