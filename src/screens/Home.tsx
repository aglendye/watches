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

  const empty = feed.data?.length === 0 && recent.data?.length === 0;
  if (empty) {
    return (
      <EmptyState
        title="Nothing here yet. Search for a watch and add the first one."
        action={
          <Link to="/add" className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 font-semibold text-on-accent">
            Add a watch
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="recent-title">
        <SectionTitle id="recent-title">Recently added</SectionTitle>
        {recent.isPending ? (
          <div className="flex gap-3 overflow-hidden" role="status" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-48 w-40 shrink-0" />
            ))}
          </div>
        ) : recent.isError ? (
          <ErrorState message={errorMessage(recent.error)} onRetry={() => void recent.refetch()} />
        ) : (
          <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {recent.data.map((w) => (
              <li key={w.watch_id} className="flex">
                <WatchCard w={w} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="feed-title">
        <SectionTitle id="feed-title">Recent activity</SectionTitle>
        {feed.isPending ? (
          <SkeletonRows rows={5} />
        ) : feed.isError ? (
          <ErrorState message={errorMessage(feed.error)} onRetry={() => void feed.refetch()} />
        ) : feed.data.length === 0 ? (
          <EmptyState title="No activity yet. Rate a watch to get things started." />
        ) : (
          <ul className="divide-y divide-line">
            {feed.data.map((item) => (
              <FeedItem key={`${item.kind}-${item.id}`} item={item} meId={me.id} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
