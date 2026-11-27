# Decisions and deviations

Running log for the maintainer. Newest phase at the top. "Spec" means the AI Agent Build Specification; "PRD" means the Product Requirements Document.

## Phase 2 (M7–M9), Nov 27

Built from the Phase 2 plan (`docs/PHASE2.md`). Adam confirmed the four open decisions at the start: private photo store, owners shown on the watch page (current and past), everyone's lists on the Lists screen (his first), and creating the Blob store.

### M7: Ownership

- Migration `004_ownerships.sql`: `ownerships` as planned (dates optional, sold not before acquired, notes ≤ 1,000). Everyone signed in reads; people write only their own rows.
- **Watch page:** a ruled row of secondary actions under the score (`I own this`, `Add to list`, `Add photo`); Rate stays the pinned button. The ownership sheet has Acquired, Sold and Notes; each save is one row, so owning two is two rows. An **Owners** section lists current owners first ("You" first among them), then past owners dimmed with a "Sold" tag. Your own rows open the sheet to edit.
- **My Collection** (`#/collection`, linked from Me): Current and Past groups. Tapping a row edits it (with "Mark as sold today" and Remove); the chevron opens the watch.
- Future dates are refused for acquired and sold (same rule as ratings).
- Ownership is not in the feed (PRD).
- **Deviation, delete guard:** the plan's guard covers ratings, lists and photos. It now also covers **other people's ownerships**, because deleting a watch would silently wipe their collection records through the cascade. The rule lives in one function, `public.watch_used_by_others(watch_id)`, used by both the trigger and `can_delete`. The error message is now "Other people have rated, owned, listed or photographed this watch, so it can't be deleted".

### M8: Lists

- Migration `005_lists.sql`: `lists` and `list_items` as planned. List-item policies use `public.owns_list(list_id)` (security definer). A trigger keeps a list's owner and created time fixed and stamps `updated_at`.
- **Lists** (`#/lists`, linked from Me): "Your lists" then "Everyone else's", newest first, each with its newest watch's picture and a count. **List detail** (`#/lists/:id`): items newest first with notes; the owner gets Edit (name, description), Add/Edit note, Remove (with confirmation) and Delete list.
- **Add to list** on the watch page: my lists as checkboxes (tap adds or removes immediately), plus a "New list" field that creates the list with the watch in it.
- Adding a watch already on the list is a no-op, not an error.
- **Feed:** "Dad created the list Grails", linking to the list.

### M9: Photos

- **Storage: private Vercel Blob store** `bezel-photos` (`store_rF7ahgURXk92kLza`, iad1, next to the Neon database), connected to the project, which added `BLOB_READ_WRITE_TOKEN`. Private stores became generally available in June 2026, so the spec's "readable by signed-in users only" is met without the public-URL fallback.
- **Hobby limits (checked Nov 27, 2026):** 1 GB storage, 10,000 reads ("simple operations"), 2,000 writes ("advanced operations") and 10 GB transfer a month. Going over blocks the store until the next month; it does not bill. With photos at about 200–400 KB, 1 GB is roughly 3,000 photos.
- **Serving:** `GET /api/photo?id=…` (`api/photo.ts`) checks the session cookie, looks the photo up under row-level security, and streams it from the store. Photos never change (a new photo gets a new id), so responses are `Cache-Control: private, max-age=31536000, immutable`: each phone downloads each photo once. The store's own CDN cache sits in front of reads, and cache hits don't count against the 10,000. `primary_image_url` is this URL, so `<img>` tags just work (same-origin cookie).
- **Uploading:** the phone shrinks the photo with a canvas (long edge 1,600 px, JPEG 0.8), which also converts HEIC to JPEG and strips location data, shows a preview with its size, then uploads the bytes to `POST /api/photo-upload?watchId=…` with a progress bar. The server checks the session, the app header (CSRF), JPEG type and magic bytes, size, and that the watch exists, writes `watch-images/{watch_id}/{image_id}.jpg`, then inserts the row (deleting the file if the insert fails).
  - **Deviation:** the size limit is **4 MB**, not 5 MB: Vercel functions accept at most 4.5 MB per request. Shrunk photos are far smaller.
  - Uploads are limited to 30 an hour per person, to protect the free write quota.
- Migration `006_watch_images.sql`: `watch_images` (no updates; delete by the uploader or an admin), `public.primary_image_url(watch_id)` (oldest photo), and `primary_image_url` appended to `watch_catalog`. It's also returned by search, Recently added, the feed, the diary, My Collection and lists, so `WatchImage` shows photos everywhere. **The rating dial is still always the drawing.**
- Deleting a photo deletes its file after the row is gone. Deleting a watch deletes its photos' files too. (If a file delete fails, the file is orphaned, never the row.)
- **Watch page:** the hero shows the primary photo (otherwise the drawing). A "Photos" strip lists every photo with who added it and when; tapping one shows it in the hero; your own (or any, for an admin) have Delete with confirmation. Deleting the main photo promotes the next oldest.
- **Feed:** "Adam added a photo of the Batman" with the photo as the thumbnail.
- **Local development** without Blob credentials stores photos in `./.local-blobs` (git-ignored). Tests use an in-memory store.
- **Not yet verified:** an upload on the live site and on a real iPhone (camera, library, HEIC). The whole flow was tested locally in an emulated iPhone browser, and the live deployment is up with no runtime errors, but this workspace can't sign in to the live site.

### Cross-cutting

- Me now starts with links to My Collection and Lists; the Me tab stays highlighted on those screens.
- Shared helpers: `BackLink`, `NavRow` (ui), `WatchName` (watch name with the orange nickname, for sheet titles).
- Tests: `tests/db/phase2.test.ts` (permissions, the date check, a watch once per list, feed items, the extended delete guard, upload checks, who can delete photos, primary promotion, file cleanup), `tests/unit/phase2.test.tsx` (ownership sheet validation, add-to-list sheet), `tests/unit/photo.test.ts` (resize maths).

## Phase 1 (M0–M6)

### Seed catalog (Adam, Nov 26)

Adam asked for 500 to 1,000 seeded watches from brands like Rolex, Omega, Breitling, AP, Tudor and Cartier, with specs filled in; ratings left empty; seeded watches may show as seeded in the feed.

- **Result:** `db/seed/catalog.csv`, ~770 watches: Rolex 188, Breitling 154, Omega 145, Cartier 78, Tudor ~49, AP 30, Patek Philippe 23, and ~100 brand-and-model entries from 27 other brands. About 600 have a case size and about 385 an introduction year.
- **Method:** big watch databases (WatchBase, WatchCharts) and AP/Cartier sites load their catalogs with scripts and could not be read. So:
  - Omega, Breitling and Tudor references come from the brands' own catalog pages (exact references, case sizes, materials).
  - Cartier references come from a jeweller's reference guide; sizes were left out where sources disagreed.
  - Rolex, AP, Patek and older references are from collector knowledge, checked against dealer and auction listings for the ones that matter most (Dad's watches, 2025 and 2026 releases, AP references).
  - Specs not confirmed are left blank rather than guessed. Dial colour is only filled where the reference fixes it (Rolex reference families have many dials).
- **Nicknames** (Batman, Hulk, Pepsi, Zombie, Bruce Wayne, Wimbledon…) are stored in `extras.nickname`, and migration `002_nickname_search.sql` adds them to search. Caliber, bezel, bracelet and discontinued year are also in `extras`.
- **Dad's watches:** Batman 116710BLNR, Hulk 116610LV, Batgirl 126710BLNR, Wimbledon Datejust 41 126334, Zombie 126713GRNR (and the yellow-gold 126718GRNR), Bruce Wayne 126710GRNR. "Black Submariner" is ambiguous (124060 no-date, 126610LN date, or an older reference), so all are in the catalog.
- **Seed account:** watches are credited to "Seed catalog" (`seed@catalog.invalid`, password hash `disabled`, cannot sign in). The feed reads "Seed catalog added …".

### Nicknames on add and edit (Adam, Nov 26)

- Add a watch has an optional Nickname field. Migration `003_add_watch_nickname.sql` adds a 4-argument `add_watch(brand, model, reference, nickname)`; the nickname is only stored when the watch is new (an existing watch is returned unchanged). The original 3-argument function is untouched.
- Edit details has a Nickname field that anyone can edit, like specs; blank removes it. Stored in `extras.nickname`, searched by migration 002, shown under the reference on the watch page and in search results.

### Watch images and drawn dials (Adam, Nov 26)

- Not scraped: watch photos on brand, dealer and auction sites are copyrighted, and the spec rules out external images.
- Every watch gets a drawn illustration generated from its data (`src/lib/watchArt.ts`, `src/components/WatchArt.tsx`): case shape (round, square, rectangular, octagonal), case metal, bezel (two-colour GMT by reference code with the night colour on top, dive insert, tachymeter, fluted, slide rule, smooth), dial colour, chronograph sub-dials, GMT hand and date window. No logos or brand text.
- `WatchImage` shows the uploaded photo when `primary_image_url` is set and the drawing otherwise, so Phase 2 photo uploads replace the drawing automatically.
- Nicknames are shown on their own line (accent colour) in search results, Recently added cards and the watch page.
- The installed app checks for a new version whenever it returns to the foreground and reloads once if the deployed bundle has changed (`src/lib/update.ts`).

### "Tool Watch" redesign (Adam, Nov 27)

Adam asked for a UI with the personality of his deepcuts app (flat, editorial, bold type, one accent, big scores) without copying it. Three directions were mocked on a design canvas; he chose C, "Tool Watch", and asked for the app to be completely like it. This replaces the Rolex green/gold look.

- **One dark look on every phone** (no light mode): graphite #131517 ground, #1b1e21 panels, #191c1f picture tiles, hairline #2c3236 borders, dive-watch orange #ff6a2b as the only accent (6.9:1 on the ground; text on orange is graphite).
- **Type:** Big Shoulders Display (bold condensed capitals) for headings, watch names, buttons and big scores; IBM Plex Mono capitals for labels, references and dates; Inter for reading text. All bundled with the app (open font licence), no outside requests; text still follows iPhone text size.
- **Shapes:** square corners everywhere (radius tokens set to 0), flat panels, no shadows. Lists are ruled rows rather than cards.
- **Signature:** the orange triangle from a dive bezel's 12 o'clock marks section labels and the "▼ BEZEL" wordmark (deepcuts' "name + dot" wordmark, mustard and all-lowercase style were deliberately not used).
- **Screens:** Home has the wordmark and a profile button above the search box; feed rows show the watch drawing, "You rated the Batman", and the score as a big orange number. The watch page shows the drawing on a flat tile ("Drawn from specs"), the score as a large number out of 10 (the small community-score dial was dropped to match the design), specs in a two-column ruled grid, and a pinned "Rate this watch" bar. The rating sheet has a "Your rating" label, the watch name in condensed capitals with the nickname in orange, the watch's own dial with an orange hand, and one "Save rating · 8" button (close with ×).
- Feed items now carry the fields the drawing needs (case material, dial colour, extras).

### Name: Bezel (Adam, Nov 26)

The app is called Bezel: browser tab, Home Screen label and install name, sign-in wordmark (serif capitals) and README. The repo, Vercel project and URL are unchanged.

### Rolex colours, serif type, watch-shaped rating dial (Adam, Nov 26)

- **Colours:** Rolex's house palette: Rolex green (#006039, with #127749 for the dark-mode spotlight), gold, and Rolex cream (#f4efea). Dark mode is a very deep green rather than black; the tab bar is solid green with gold for the current tab. No logos, crown or wordmark.
- **Type:** Cormorant Garamond (open font licence, bundled with the app, no outside requests) for headings, watch names, sheet titles and scores; small tracked capitals for labels and the tab bar; the system font for body text so iPhone text-size settings still apply.
- **Rating dial = the watch:** the rating dial (and the community-score dial on the watch page) is the watch's own drawing: case shape, bezel and dial colours, with ten score markers in place of the hours and a gold hand. Turning it turns the watch's bezel (the GMT or dive insert rotates). Roman-numeral dials (Cartier, Wimbledon) show numerals only. The rating dial is always the drawing, even when the watch has an uploaded photo; the photo only replaces the picture at the top of the watch page and in lists.
- **Taps go by angle:** a tap anywhere on the dial picks the nearest number by angle, like turning does, so narrow rectangular dials work (their numbers sit too close for separate tap targets). The marker buttons remain for keyboard and VoiceOver.
- **A new watch with no photo** is drawn from whatever was typed: words in the model name (Submariner, Daytona, Tank, Royal Oak…), the reference suffix and any specs or nickname added later. With nothing to go on it's a plain round steel watch with a dark dial; editing details updates the drawing.

### Look and feel, turning dial, seeding rules (Adam, Nov 26)

- **Theme:** styled after classic luxury-watch marketing without using any brand's marks: deep green, champagne gold and cream; light, large headings; gold small-caps labels; pill buttons; a green spotlight behind watch pictures in dark mode (cream in light mode). Dark mode keeps the near-black base. App icons regenerated in the same colours.
- **Turning the dial:** drag a finger around the rating dial and the hand follows, stepping through the numbers (with a light vibration where the phone supports it); a knurled bezel ring turns with it. On release the hand settles on the nearest number. Tapping markers, arrow keys and the number row still work. The dial area doesn't scroll the sheet (`touch-action: none`).
- **Seeding never duplicates:** `npm run db:seed` skips any row already in the catalog, comparing brand, model and reference without case, spaces or punctuation; `--check` is a dry run that lists what's new and which rows lack drawing data. Covered by a DB test.

### Bracelet and bezel

Kept in `extras` (free text such as "Jubilee or Oyster", "Bidirectional 24h, blue/black Cerachrom") rather than as core columns: Rolex sells many references on more than one bracelet, and the app has no filtering yet. If filtering is added, promote `bracelet` and `bezel` to core columns with fixed choices.

### Password reset removed (Adam, Nov 26)

Adam chose to drop self-service password reset instead of setting up Gmail. The "Forgot password?" link, the reset screen, the three reset API actions, the email module and the `nodemailer` dependency are gone. The `auth.reset_codes` table stays in the database (unused, harmless) so no migration is needed. A forgotten password is reset by hand (README, "Forgotten passwords"). This deviates from PRD 5.1 and spec 8.3.


### Platform: Vercel + Neon instead of Supabase (requested by Adam)

The spec assumed Supabase for Postgres, auth, and storage. Adam asked for Vercel hosting, his Neon database, and separate image storage. What replaces each Supabase piece:

| Supabase piece | Replacement |
|---|---|
| Supabase Auth (email/password) | Our own auth in `server/actions.ts`: scrypt password hashes in `auth.users`, random session tokens (stored hashed) in `auth.sessions`. |
| `auth.uid()` from the JWT | `auth.uid()` reads `app.user_id`, set per transaction by `auth.begin_session(token_hash)`. |
| `authenticated` / `anon` roles | Created in `000_platform.sql`. The API connects as the owner, then `set local role authenticated` for every signed-in request, so the RLS policies in `001_core.sql` apply unchanged. |
| supabase-js queries from the browser | One endpoint, `POST /api/rpc {action, params}`. The browser never touches the database. |
| Supabase Storage (Phase 2) | Vercel Blob (Adam's choice; no new account). |

Consequences:

- `001_core.sql` is the original `schema.sql` byte for byte except its header comment. `000_platform.sql` supplies the missing Supabase parts, including Supabase-style default privileges so the original grants/revokes work.
- Spec 7 "client–database contract" is implemented as RPC actions with the same queries done in SQL on the server. Where the spec asked for a second query to fetch display names or watch names, the server joins them in one query.
- **Feed (spec 7):** merged in SQL (`union all` of the 30 newest ratings and 30 newest watches, ordered by `created_at`, limit 30) instead of client-side. Same result, one round trip.
- **Search results:** joined to `watch_stats` so rows show average and count (PRD 5.3), which `search_watches` alone doesn't return.
- **Sessions:** an httpOnly, Secure, SameSite=Lax cookie with a 400-day max age (the browser maximum), renewed every time the app starts or comes back to the foreground. No inactivity timeout (PRD 5.1). Signing out deletes the session row.
- **CSRF:** SameSite=Lax plus a required `X-Requested-With: watch-app` header on every API call.
- **Rate limits (PRD 8):** sign-up 10/hour per IP; sign-in 30 per 15 min per IP and 10 per 15 min per email. Stored in `auth.rate_limits`.
- **CAPTCHA:** not implemented (spec 3 marks it optional; PRD 5.1 asks for it). Turnstile can be added later; the rate limits cover a family-sized app. *Change if you want it.*
- **Database driver:** Neon's HTTP driver in production (one round trip per request, as a single transaction). Set `DB_DRIVER=pg` in Vercel to switch to plain TCP if ever needed. Tests use `pg` against a local Postgres 16 with a non-superuser owner role, matching Neon's privileges.
- **Migrations folder:** `db/migrations/` (spec said `supabase/migrations/`); seed at `db/seed/seed.csv` (spec said `supabase/seed/`).
- **DB acceptance tests (spec 6.8):** written as Vitest tests that run SQL and API calls against a real Postgres (`npm run test:db`), rather than `.sql` scripts. All nine scenarios plus auth flows pass.

### UI choices (assumed; change freely)

- **Visual identity:** warm off-white / near-black, one deep green accent (mint in dark mode), system fonts, 12 px radius, small uppercase labels for a spec-sheet feel. Icons are a plain dial, generated by `npm run icons`.
- **Dial semantics:** markers use `role="radio"` with `aria-checked` inside a `radiogroup` (the correct pattern for a radio group). The spec said `aria-pressed`; that's used on the fallback row of numbered buttons instead.
- **Dial hand:** a pointer from the center ring toward the marker, so the chosen number in the center stays readable.
- **Home layout:** "Recently added" strip above "Recent activity", because the feed is long and the strip would otherwise be far down the page.
- **Search field shared by Home and results:** typing on Home moves to `#/search` without replacing the input, so the iPhone keyboard stays open.
- **Add watch prefill:** if the search text starts with a known brand ("omega speedmaster"), Brand and Model are split; otherwise all of it goes in Model (spec's default).
- **Watch delete:** available on Edit details for the creator (only while no one else has rated it) or an admin, with confirmation. Deleting also removes the creator's own ratings of it (cascade, per schema).
- **Watch page:** one sticky Rate button (reads "Rate again" once you've rated) instead of a second inline Rate button.
- **Your own latest rating** is shown first in the watch's ratings list (PRD assumption).
- **Diary paging:** a "Show more" button, 50 entries per page.
- **Error boundary:** a crash shows "Something went wrong" with a reload button instead of a blank page.

### Dependencies added beyond spec 4

- `@neondatabase/serverless`, `pg`: database drivers (Neon HTTP in production; TCP for migrations, seed, tests).
- `@vercel/node` (dev, types only), `sharp` (dev, icon generation).

### Not yet verified

- ~~Neon's HTTP transaction running `set local role` in production~~: verified on Neon and on the live Vercel deployment (Nov 26).
- The iPhone checklist (README) on a real device: Safari behaviour (session cookie persistence in the Home Screen app, Dynamic Type, safe areas) was checked in a desktop Chrome emulating an iPhone, not on an iPhone.

### Seed data

`db/seed/seed.csv` has 35 well-known watches. References are included only for well-established ones (e.g., Speedmaster Professional 310.30.42.50.01.001, Submariner Date 126610LN, Black Bay 58 79030N, Grand Seiko SBGA211). Review before loading.
