# Decisions and deviations

Running log for the maintainer. Newest phase at the top. "Spec" means the AI Agent Build Specification; "PRD" means the Product Requirements Document.

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
