# Bezel: Phase 2 plan

> **Status (Nov 27, 2026): built and deployed.** M7, M8 and M9 are live; migrations 004–006 are applied to Neon; the private Blob store `bezel-photos` exists. What was decided along the way is in `DECISIONS.md` (Phase 2). Still open: the real-iPhone checklist (README, rows 1–14).

Written Nov 27, 2026, at the end of Phase 1. This is the hand-off for a new chat: read it, then `DECISIONS.md`, then start at "Build order". The product intent is in the project docs `watch-app-prd.md` (sections 5.7–5.9, 5.11, 7) and `watch-app-ai-agent-spec.md` (sections 6.7, 8.6b, milestones M7–M9). Where this plan differs from them, this plan wins: it reflects decisions made since (Neon + Vercel instead of Supabase, the Tool Watch design, and so on).

## Where things are

| What | Where |
|---|---|
| Live app | https://watches-cyan.vercel.app ("Bezel"), installed on iPhone as a Home Screen app |
| Code | GitHub `aglendye/watches`, branch `main`. Pushing to `main` deploys to production automatically. Adam's local copy is `~/Desktop/watches` (run `git pull` there). |
| Hosting | Vercel project `prj_UOKszWDSiZicRpJ5eNTX5kBEhU9P`, team `team_TMMSDjFa5vlfEfqTVKTvvTDF`. Only env var so far: `DATABASE_URL` (Neon, pooled). |
| Database | Neon project `still-shadow-09029007` (Postgres 17). Migrations applied: `000`–`003` in `db/migrations/`. |
| Images | Vercel Blob: chosen, **not created yet** (step M9.1). |
| Decisions log | `DECISIONS.md` in the repo, mirrored to the project doc `claude/watch-app-decisions.md`. Update both after each milestone. |
| Design reference | Design canvas "Bezel — UI directions" (direction C, "Tool Watch") and the live app. |
| Adding catalog watches | The `watch-catalog-scrape` skill and README "Adding more watches later". Seeding never duplicates and every watch gets a drawing automatically. |

## How the app works (read before coding)

- **Stack:** Vite + React 18 + TypeScript (strict), Tailwind v4, HashRouter, React Query v5. Server is one Vercel function, `api/rpc.ts`: `POST /api/rpc {action, params}`. Actions live in `server/actions.ts` (`publicActions`, `userActions`); input checks in `server/validate.ts`; error mapping in `server/errors.ts`; shared types in `shared/types.ts`. Server imports use `.js` extensions (ESM).
- **Auth and security:** our own auth (`auth.users`, `auth.sessions`, scrypt). Every signed-in request runs `select auth.begin_session($1)` then `set local role authenticated`, so the row-level-security policies apply exactly as written. New tables need RLS, policies for `authenticated`, and grants following the patterns in `001_core.sql` and `000_platform.sql`. `auth.uid()` and `public.is_admin()` work in policies.
- **Database access from here:** the cloud workspace and Adam's Mac can't reach Neon directly. Apply migrations with the Neon MCP (`run_sql_transaction` on `still-shadow-09029007`). Test locally first against Postgres 16 (see README "Tests"). The local server stops between turns; restart it with:
  `su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgdata -l /tmp/pg.log -o '-k /tmp -p 5432 -c listen_addresses=localhost' start"`
- **Checks before every push:** `npx tsc -b`, `npx eslint .`, `npx vitest run` (unit), `npx vitest run --config vitest.db.config.ts` (database acceptance), `npm run build`. Then confirm the Vercel deployment is READY. For UI changes, take Playwright screenshots at 390×844 (`npm i --no-save playwright-core` if missing).
- **Drawings and photos:** `src/lib/watchArt.ts` + `src/components/WatchArt.tsx`. `WatchImage({watch, photoUrl})` shows the photo when `photoUrl` is set, otherwise the drawing. **The rating dial is always the drawing, even when a photo exists** (Adam's decision).
- **Installed-app updates:** the app reloads itself when a new version is deployed (`src/lib/update.ts`). A changed Home Screen icon still needs removing and re-adding on the phone.

## Design rules (Tool Watch: apply to every new screen)

- One dark look: graphite `--bg #131517`, panels `--surface #1b1e21`, picture tiles `.hero` `#191c1f`, hairlines `--border #2c3236`, the only accent is orange `--accent #ff6a2b` (text on orange is graphite).
- Type: `.display` (Big Shoulders, bold condensed capitals) for headings, watch names and buttons; `.num` for big scores; `.label` (IBM Plex Mono capitals) for labels; `.mono` for references and dates; Inter for reading text. Sizes in rem.
- Square corners, flat panels, no shadows. Lists are ruled rows (`border-b border-line`), not cards. Section headings use `SectionTitle` (orange dive-pip triangle + label).
- Reuse `Button` (primary = orange condensed capitals), `Field`, `Sheet` (supports `eyebrow` + ReactNode `title`), `ConfirmDialog`, `EmptyState`, `ErrorState`, `SkeletonRows`, `useToast`.
- Every list has a loading skeleton, an empty state with a next action, and an error state with Retry. Deletes ask for confirmation. Tap targets ≥ 44 px, VoiceOver labels, `prefers-reduced-motion`.

## Phase 2 scope

Three features plus the feed additions, built in this order. Each milestone ends with tests green, `DECISIONS.md` updated, deployed, and a short report to Adam.

### M7: Ownership ("I own this" and My Collection)

1. **Migration `004_ownerships.sql`:** `ownerships (id, user_id default auth.uid() → profiles cascade, watch_id → watches cascade, acquired_on date null, sold_on date null, notes text null ≤ 1,000, created_at)`, check `sold_on >= acquired_on` when both are set, index on `(user_id)` and `(watch_id)`. RLS: everyone signed in can read; insert, update and delete only your own rows.
2. **Actions:** `ownerships.forWatch` (all owners of a watch, with display names), `ownerships.mine` (my collection, joined to the catalog with drawing fields), `ownerships.create`, `ownerships.update`, `ownerships.delete`.
3. **Watch page:** an "I own this" secondary action (Rate stays the main, pinned button). It opens an ownership sheet: acquired date, sold date, notes. Each save creates one row; owning two of the same watch is two rows. Add an "Owners" section listing who owns it now ("You", "Dad"), with past owners marked "sold". *(Assumed: owners shown on the watch page, since the PRD says ownership is visible to everyone signed in.)*
4. **My Collection screen** `#/collection`: "Current" (no sold date) and "Past" groups as ruled rows with the drawing or photo, name, nickname, acquired date. Tap a row to edit or delete it (or "Mark as sold"). Linked from Me.
5. Ownership changes do **not** appear in the activity feed (PRD).
6. **Tests:** DB tests for the permission rules and the date check; a component test for the ownership sheet's validation.

### M8: Lists

1. **Migration `005_lists.sql`:** `lists (id, user_id, name 1–80, description ≤ 500 null, created_at, updated_at)`; `list_items (list_id → lists cascade, watch_id → watches cascade, note ≤ 280 null, added_at, primary key (list_id, watch_id))`. RLS: everyone signed in reads; only the list's owner writes the list and its items. **Extend the watch delete guard:** a watch can't be deleted (except by an admin) while another user's list contains it.
2. **Actions:** `lists.index` (all lists with owner name and item count, mine first then newest), `lists.get` (list + items with drawing fields, sorted by date added), `lists.create`, `lists.update`, `lists.delete`, `lists.forWatch` (my lists, flagged if they already contain this watch), `listItems.add`, `listItems.remove`, `listItems.updateNote`.
3. **Screens:** `#/lists` index; `#/lists/:id` detail with watch rows and notes (the owner gets Edit, Delete list, and remove/edit-note per item); create and edit sheet (name, description). Linked from Me.
4. **Watch page:** "Add to list" action opens a sheet listing my lists with checkmarks (tap to add or remove), plus "New list" inline (name field and create, which also adds the watch).
5. **Feed:** "Dad created the list Grails" (links to the list). Lists are unordered (PRD).
6. **Tests:** DB tests (owner-only writes, a watch once per list, extended delete guard) and component tests for the add-to-list sheet.

### M9: Photos (Vercel Blob)

1. **Set up storage:** create a Vercel Blob store connected to the Vercel project (this adds `BLOB_READ_WRITE_TOKEN`). Ask Adam before creating it, and check the current Hobby-plan Blob limits first (they were confirmed free earlier, but check the numbers). For local development, add the token to `.env.local`; never commit it.
2. **Privacy (decide at the start):** the spec wants images readable only by signed-in users. If Vercel Blob offers private stores, use one and serve images through an authenticated route. Otherwise use public blobs at long random paths (`watch-images/{watch_id}/{uuid}.jpg`) and record the deviation in `DECISIONS.md`. Check the current Vercel docs; don't assume.
3. **Migration `006_watch_images.sql`:** `watch_images (id, watch_id → watches cascade, uploaded_by default auth.uid(), storage_path text, width int, height int, created_at)`. RLS: everyone signed in reads; anyone signed in inserts their own; delete by the uploader or an admin. The primary photo is the oldest row. **Extend the watch delete guard** to other users' photos. Add `primary_image_url` to what `watch_catalog`, search, recent, feed and diary return, so photos appear everywhere through `WatchImage` (the rating dial stays the drawing).
4. **Upload flow:** on the watch page, "Add photo" opens the camera or photo library (`<input type="file" accept="image/*">`). Compress in the browser with a canvas to a maximum long edge of 1,600 px, JPEG quality 0.8, and reject anything still over 5 MB. Show a preview and upload progress. Upload through a server route that checks the session and the image type and size, writes to Blob, then inserts the row (or, if using Blob client uploads, authorize in the token callback). Keep the Vercel function request-size limit in mind; compressed photos are a few hundred KB.
5. **Watch page:** the hero shows the primary photo (otherwise the drawing, as now). A swipeable gallery strip shows all photos with the uploader's name; your own photos (or any photo, for an admin) have Delete with confirmation. Deleting the primary promotes the next oldest; delete the Blob file too.
6. **Feed:** "Adam added a photo of the Batman" with a thumbnail.
7. **Tests:** DB tests (who can delete, primary promotion, delete guard); a unit test for the resize maths; a manual iPhone test (camera, photo library, HEIC photos converting to JPEG through the canvas).

### Cross-cutting in Phase 2

- **Routes:** add `#/collection`, `#/lists`, `#/lists/:id`. The tab bar stays Home, Add, My Diary, Me. Me gets links to My Collection and Lists.
- **Watch page actions:** Rate stays the pinned primary button. "I own this", "Add to list" and "Add photo" sit together as secondary actions, in Tool Watch style (outlined condensed capitals or a ruled action row).
- **Feed:** new item types: photo added and list created. The feed is still built from the tables (no events table); ownership is excluded.
- **Delete guard:** after M8 and M9, a watch is deletable by a non-admin only when no other user has rated it, listed it, or added photos.
- **Docs:** update README (new screens; Blob setup), `DECISIONS.md` and the project doc, and the iPhone checklist.

## Not in Phase 2 (Phase 3 or never)

- Phase 3: links on watches, the extras editor, diary CSV export.
- Never (spec guardrails): merge tools, rankings, prices, AI autofill, analytics or trackers, paid services, hotlinked or scraped photos.

## Open items carried over

- Which "black Submariner" Dad owns (124060 no-date, 126610LN date, or an older reference). All of them are in the catalog.
- The real-iPhone checklist (README) hasn't been run on a physical phone, only in an emulated iPhone browser.
- Adam's Desktop copy is behind: in `~/Desktop/watches` run `git checkout package-lock.json && git pull`.

## Decisions to confirm with Adam when Phase 2 starts

Defaults in brackets; ask once, then build.

1. Photo privacy: [private store if available; otherwise public with unguessable paths].
2. Owners shown on the watch page: [yes, current owners plus past owners marked sold].
3. Lists index shows everyone's lists: [yes, mine first; that's what the PRD says].
4. Create the Vercel Blob store now: [yes, after checking the free limits].
