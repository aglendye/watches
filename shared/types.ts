// Types shared by the API (server/) and the app (src/). Type-only: no runtime code.

export type MovementType = 'automatic' | 'manual' | 'quartz' | 'other';

export interface Me {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export interface SearchResult {
  watch_id: string;
  brand_name: string;
  model_name: string;
  watch_reference: string | null;
  match_score: number;
  nickname: string | null;
  case_material: string | null;
  dial_color: string | null;
  extras: Record<string, unknown>;
  /** Primary photo, when one has been uploaded (Phase 2). The drawing is shown otherwise. */
  primary_image_url?: string | null;
  avg_score: number | null;
  rating_count: number;
}

export interface WatchSpecs {
  case_size_mm: number | null;
  movement_type: MovementType | null;
  case_material: string | null;
  dial_color: string | null;
  water_resistance_m: number | null;
  year_introduced: number | null;
  extras: Record<string, unknown>;
}

export interface CatalogWatch extends WatchSpecs {
  watch_id: string;
  brand_id: string;
  brand_name: string;
  model_id: string;
  model_name: string;
  reference: string | null;
  created_by: string;
  created_at: string;
  avg_score: number | null;
  rating_count: number;
  /** Primary photo, when one has been uploaded (Phase 2). The drawing is shown otherwise. */
  primary_image_url?: string | null;
}

export interface WatchDetail extends CatalogWatch {
  created_by_name: string;
  updated_by_name: string | null;
  updated_at: string | null;
  can_edit_identity: boolean;
  can_delete: boolean;
}

export interface RatingEntry {
  id: string;
  user_id: string;
  watch_id: string;
  score: number;
  review_text: string | null;
  rated_on: string; // YYYY-MM-DD
  created_at: string;
}

export interface CommunityRating extends RatingEntry {
  display_name: string;
  entry_count: number;
}

export interface DiaryEntry extends RatingEntry {
  brand_name: string;
  model_name: string;
  reference: string | null;
  case_material?: string | null;
  dial_color?: string | null;
  extras?: Record<string, unknown> | null;
}

export interface FeedItem {
  kind: 'rating' | 'watch' | 'list' | 'photo';
  id: string;
  created_at: string;
  user_id: string;
  display_name: string;
  /** Null for list items; every other kind is about a watch. */
  watch_id: string | null;
  brand_name: string | null;
  model_name: string | null;
  reference: string | null;
  case_material?: string | null;
  dial_color?: string | null;
  extras?: Record<string, unknown> | null;
  score: number | null;
  snippet: string | null;
  /** 'list' items: the list. */
  list_id: string | null;
  list_name: string | null;
  /** 'photo' items: the new photo. */
  image_url?: string | null;
  primary_image_url?: string | null;
}

export interface Page<T> {
  items: T[];
  hasMore: boolean;
}

export interface SpecUpdate {
  case_size_mm?: number | null;
  movement_type?: MovementType | null;
  case_material?: string | null;
  dial_color?: string | null;
  water_resistance_m?: number | null;
  year_introduced?: number | null;
  nickname?: string | null;
  /** Identity fields: only sent by the creator or an admin. */
  brand?: string;
  model?: string;
  reference?: string | null;
}

/** Brand, model and the fields the drawing needs. */
export interface WatchArtFields {
  brand_name: string;
  model_name: string;
  reference: string | null;
  case_material: string | null;
  dial_color: string | null;
  extras: Record<string, unknown> | null;
  primary_image_url?: string | null;
}

export interface Ownership {
  id: string;
  user_id: string;
  watch_id: string;
  acquired_on: string | null; // YYYY-MM-DD
  sold_on: string | null;
  notes: string | null;
  created_at: string;
}

export interface WatchOwner extends Ownership {
  display_name: string;
}

export interface CollectionItem extends Ownership, WatchArtFields {}

export interface OwnershipInput {
  acquiredOn: string;
  soldOn: string;
  notes: string;
}

export interface ListSummary {
  id: string;
  user_id: string;
  display_name: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  is_mine: boolean;
  item_count: number;
  /** Up to three of the most recently added watches, for the thumbnails. */
  preview: WatchArtFields[];
}

export interface ListItem extends WatchArtFields {
  watch_id: string;
  note: string | null;
  added_at: string;
}

export interface ListDetail extends Omit<ListSummary, 'item_count' | 'preview'> {
  items: ListItem[];
}

/** One of my lists, for the add-to-list sheet. */
export interface MyListForWatch {
  id: string;
  name: string;
  item_count: number;
  contains: boolean;
}

export interface WatchPhoto {
  id: string;
  uploaded_by: string;
  display_name: string;
  width: number | null;
  height: number | null;
  created_at: string;
  url: string;
  can_delete: boolean;
}
