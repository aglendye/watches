// React Query hooks for every read and write the app makes.
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import type {
  CollectionItem,
  ListDetail,
  ListSummary,
  MyListForWatch,
  CommunityRating,
  OwnershipInput,
  WatchOwner,
  DiaryEntry,
  FeedItem,
  CatalogWatch,
  Page,
  RatingEntry,
  SearchResult,
  SpecUpdate,
  WatchDetail,
  WatchPhoto,
} from '../../shared/types';
import { call } from './api';

const LIST_STALE = 30_000;

export function useSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => call<SearchResult[]>('watches.search', { q: query, maxResults: 20 }),
    enabled: query.length > 0,
    staleTime: LIST_STALE,
    placeholderData: keepPreviousData,
  });
}

export function useWatch(id: string) {
  return useQuery({
    queryKey: ['watch', id],
    queryFn: () => call<WatchDetail>('watches.get', { id }),
  });
}

export function useCommunityRatings(watchId: string) {
  return useQuery({
    queryKey: ['ratings', watchId],
    queryFn: () => call<CommunityRating[]>('ratings.forWatch', { watchId }),
    staleTime: LIST_STALE,
  });
}

export function usePersonEntries(watchId: string, userId: string | null) {
  return useQuery({
    queryKey: ['person', watchId, userId],
    queryFn: () => call<RatingEntry[]>('ratings.personEntries', { watchId, userId }),
    enabled: !!userId,
  });
}

export function useDiary() {
  return useInfiniteQuery({
    queryKey: ['diary'],
    queryFn: ({ pageParam }) => call<Page<DiaryEntry>>('diary.list', { page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length : undefined),
    staleTime: LIST_STALE,
  });
}

export function useFeed() {
  return useQuery({ queryKey: ['feed'], queryFn: () => call<FeedItem[]>('home.feed'), staleTime: LIST_STALE });
}

export function useRecent() {
  return useQuery({ queryKey: ['recent'], queryFn: () => call<CatalogWatch[]>('home.recent'), staleTime: LIST_STALE });
}

export function useBrandSuggestions(prefix: string) {
  const p = prefix.trim();
  return useQuery({
    queryKey: ['brands', p.toLowerCase()],
    queryFn: () => call<string[]>('brands.suggest', { prefix: p }),
    enabled: p.length > 0,
    staleTime: LIST_STALE,
    placeholderData: keepPreviousData,
  });
}

export function useModelSuggestions(brand: string, prefix: string) {
  const b = brand.trim();
  const p = prefix.trim();
  return useQuery({
    queryKey: ['models', b.toLowerCase(), p.toLowerCase()],
    queryFn: () => call<string[]>('models.suggest', { brand: b, prefix: p }),
    enabled: b.length > 0,
    staleTime: LIST_STALE,
    placeholderData: keepPreviousData,
  });
}

export function useLookup(brand: string, model: string, reference: string) {
  const key = [brand.trim().toLowerCase(), model.trim().toLowerCase(), reference.trim().toLowerCase()];
  return useQuery({
    queryKey: ['lookup', ...key],
    queryFn: () => call<{ id: string | null }>('watches.lookup', { brand, model, reference }),
    enabled: key[0].length > 0 && key[1].length > 0,
    staleTime: 10_000,
  });
}

/** Every write invalidates all cached reads: simple and always correct at this size. */
function useWrite<P, R>(fn: (p: P) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries() });
}

export const useAddWatch = () =>
  useWrite((p: { brand: string; model: string; reference: string; nickname?: string }) => call<{ id: string }>('watches.add', p));

export const useUpdateWatch = () =>
  useWrite((p: SpecUpdate & { id: string }) => call<{ ok: true }>('watches.update', { ...p }));

export const useDeleteWatch = () => useWrite((id: string) => call<{ ok: true }>('watches.delete', { id }));

export interface RatingInput {
  score: number;
  reviewText: string;
  ratedOn: string;
}

export const useCreateRating = () =>
  useWrite((p: RatingInput & { watchId: string }) => call<{ id: string }>('ratings.create', { ...p }));

export const useUpdateRating = () =>
  useWrite((p: RatingInput & { id: string }) => call<{ ok: true }>('ratings.update', { ...p }));

export const useDeleteRating = () => useWrite((id: string) => call<{ ok: true }>('ratings.delete', { id }));

export const useUpdateProfile = () =>
  useWrite((displayName: string) => call<{ ok: true }>('profile.update', { displayName }));

// ---------------------------------------------------------------------
// Ownership (M7)
// ---------------------------------------------------------------------
export function useOwners(watchId: string) {
  return useQuery({
    queryKey: ['owners', watchId],
    queryFn: () => call<WatchOwner[]>('ownerships.forWatch', { watchId }),
    staleTime: LIST_STALE,
  });
}

export function useCollection() {
  return useQuery({
    queryKey: ['collection'],
    queryFn: () => call<CollectionItem[]>('ownerships.mine'),
    staleTime: LIST_STALE,
  });
}

export const useCreateOwnership = () =>
  useWrite((p: OwnershipInput & { watchId: string }) => call<{ id: string }>('ownerships.create', { ...p }));

export const useUpdateOwnership = () =>
  useWrite((p: OwnershipInput & { id: string }) => call<{ ok: true }>('ownerships.update', { ...p }));

export const useDeleteOwnership = () => useWrite((id: string) => call<{ ok: true }>('ownerships.delete', { id }));

// ---------------------------------------------------------------------
// Lists (M8)
// ---------------------------------------------------------------------
export function useLists() {
  return useQuery({ queryKey: ['lists'], queryFn: () => call<ListSummary[]>('lists.index'), staleTime: LIST_STALE });
}

export function useList(id: string) {
  return useQuery({ queryKey: ['list', id], queryFn: () => call<ListDetail>('lists.get', { id }) });
}

export function useMyListsForWatch(watchId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['listsForWatch', watchId],
    queryFn: () => call<MyListForWatch[]>('lists.forWatch', { watchId }),
    enabled,
  });
}

export interface ListInput {
  name: string;
  description: string;
}

export const useCreateList = () =>
  useWrite((p: ListInput & { watchId?: string }) => call<{ id: string }>('lists.create', { ...p }));

export const useUpdateList = () => useWrite((p: ListInput & { id: string }) => call<{ ok: true }>('lists.update', { ...p }));

export const useDeleteList = () => useWrite((id: string) => call<{ ok: true }>('lists.delete', { id }));

export const useAddListItem = () =>
  useWrite((p: { listId: string; watchId: string }) => call<{ ok: true }>('listItems.add', p));

export const useRemoveListItem = () =>
  useWrite((p: { listId: string; watchId: string }) => call<{ ok: true }>('listItems.remove', p));

export const useUpdateListNote = () =>
  useWrite((p: { listId: string; watchId: string; note: string }) => call<{ ok: true }>('listItems.updateNote', p));

// ---------------------------------------------------------------------
// Photos (M9)
// ---------------------------------------------------------------------
export function usePhotos(watchId: string) {
  return useQuery({
    queryKey: ['photos', watchId],
    queryFn: () => call<WatchPhoto[]>('photos.forWatch', { watchId }),
    staleTime: LIST_STALE,
  });
}

export const useDeletePhoto = () => useWrite((id: string) => call<{ ok: true }>('photos.delete', { id }));

/** After an upload (which doesn't go through call()), refresh everything. */
export function useAfterUpload() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
