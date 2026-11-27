import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DiaryEntry } from '../../shared/types';
import { RatingSheet } from '../components/RatingSheet';
import { Button, EmptyState, ErrorState, ScoreBadge, SkeletonRows } from '../components/ui';
import { errorMessage } from '../lib/api';
import { formatDate, watchTitle } from '../lib/format';
import { useDiary } from '../lib/queries';

export function Diary() {
  const diary = useDiary();
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const entries = diary.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="display text-[2.75rem]">My Diary</h1>
      {diary.isPending ? (
        <SkeletonRows rows={6} />
      ) : diary.isError ? (
        <ErrorState message={errorMessage(diary.error)} onRetry={() => void diary.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Your diary is empty. Rate your first watch."
          action={
            <Link to="/search" className="display inline-flex min-h-12 items-center bg-accent px-5 text-lg tracking-[0.06em] text-on-accent">
              Find a watch
            </Link>
          }
        />
      ) : (
        <>
          <ul className="border-t border-line">
            {entries.map((e) => {
              const t = watchTitle(e);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(e)}
                    className="flex w-full items-start gap-3 border-b border-line py-3 text-left"
                    aria-label={`${t.title}, ${e.score} out of 10 on ${formatDate(e.rated_on)}. Edit entry`}
                  >
                    <ScoreBadge score={e.score} />
                    <div className="min-w-0 flex-1">
                      <p className="label !text-[0.625rem]">{e.brand_name}</p>
                      <p className="display truncate text-xl">{e.model_name}</p>
                      <p className="mono truncate text-xs text-muted">
                        {formatDate(e.rated_on)}
                        {t.hasReference && <> · {e.reference}</>}
                      </p>
                      {e.review_text && <p className="mt-1 truncate text-sm">{e.review_text}</p>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {diary.hasNextPage && (
            <Button kind="secondary" className="w-full" busy={diary.isFetchingNextPage} onClick={() => void diary.fetchNextPage()}>
              Show more
            </Button>
          )}
        </>
      )}
      {editing && (
        <RatingSheet
          open
          onClose={() => setEditing(null)}
          watchId={editing.watch_id}
          watchTitle={watchTitle(editing).title}
          watch={editing}
          entry={editing}
        />
      )}
    </div>
  );
}
