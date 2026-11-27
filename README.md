# Watch Ratings

A Home Screen web app for rating watches with a dial, keeping a dated diary of ratings, and seeing what friends think. Built as a Christmas gift.

- **Frontend:** Vite, React 18, TypeScript, Tailwind. Hash routes, no service worker.
- **API:** one Vercel serverless function, `api/rpc.ts`, with every action in `server/actions.ts`.
- **Database:** Neon Postgres. Row-level security does the permission work: every signed-in request runs as the `authenticated` role with the user's id set (see `db/migrations/000_platform.sql`).
- **Login:** email and password (hashed with scrypt), a long-lived httpOnly session cookie, and password reset by a 6-digit code emailed from Gmail.
- **Photos (Phase 2):** Vercel Blob.

`DECISIONS.md` lists every choice and deviation from the spec.

---

## Setup (about 20 minutes, once)

You need: your GitHub, Vercel, and Google (Gmail) accounts, and Node 20+ on your computer for two commands.

### 1. Put the code on Vercel

1. Push this repository to GitHub (it may already be there).
2. In Vercel, create a new project by importing the GitHub repository. Vercel's guide: <https://vercel.com/docs/getting-started-with-vercel/import>. It detects Vite; keep the defaults.
3. The first deploy builds fine, but the app will say "Can't reach the server" until the database is connected. That's expected.

### 2. Add a Neon database through Vercel

1. Open the Neon integration on the Vercel Marketplace, <https://vercel.com/marketplace/neon>, install it, choose the free plan and a US East region, and connect it to this project. Neon's walkthrough: <https://neon.com/docs/guides/vercel-managed-integration>.
2. Check the project's environment variables in Vercel (Settings → Environment Variables). The integration adds `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct).

### 3. Create the tables (migrations)

On your computer, in this folder:

```bash
npm install
DATABASE_URL='<paste DATABASE_URL_UNPOOLED from Vercel>' npm run db:migrate
```

You should see `Applying 000_platform.sql`, `Applying 001_core.sql`, `Migrations up to date.` It is safe to run again; it only applies new files.

### 4. Set up Gmail for reset codes

1. Your Google account needs 2-Step Verification turned on.
2. Create an app password named "Watch Ratings": <https://support.google.com/accounts/answer/185833>. Copy the 16-character password (spaces don't matter).
3. In Vercel → Settings → Environment Variables, add (for Production and Preview):
   - `SMTP_USER` = your Gmail address
   - `SMTP_PASS` = the app password
4. Gmail sends from your address. The subject is "123456 is your Watch Ratings code". Gmail allows a few hundred messages a day, plenty here.
5. Note: Google revokes app passwords when you change your Google password. If resets stop working, make a new one.

### 5. Redeploy and make yourself admin

1. In Vercel, redeploy (Deployments → the latest → Redeploy) so the new variables take effect.
2. On your iPhone, open the site in Safari, tap Share → Add to Home Screen, open it from the Home Screen, and create your account there.
3. Make yourself admin. In the Neon console's SQL Editor (open Neon from the Vercel integration page):

   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where lower(email) = lower('you@example.com'));
   ```

### 6. Load the starter catalog

1. Review `db/seed/seed.csv`. Add Dad's collection and wishlist at the bottom as `brand,model,reference` lines (leave reference empty when unsure).
2. Load it as your account (it's credited as "added by" you):

   ```bash
   DATABASE_URL='<DATABASE_URL_UNPOOLED>' SEED_EMAIL='you@example.com' npm run db:seed
   ```

   Re-running is safe; existing watches are found, not duplicated.

### 7. Test on a real iPhone

Go through the checklist at the end of this file.

---

## Local development

```bash
npm install
cp .env.example .env.local    # set DATABASE_URL (a Neon branch, or a local Postgres)
npm run db:migrate            # with DATABASE_URL set in your shell
npm run dev                   # http://localhost:5173, API included
```

Without `SMTP_USER`/`SMTP_PASS`, reset codes are printed in the `npm run dev` terminal.

Useful SQL for maintenance (Neon SQL Editor):

```sql
-- Who's signed up
select u.email, p.display_name, p.is_admin, u.created_at
from auth.users u join public.profiles p on p.id = u.id order by u.created_at;

-- Merge a duplicate watch B into A (back up first: Neon → Branches → create a branch)
update public.ratings set watch_id = '<A>' where watch_id = '<B>';
delete from public.watches where id = '<B>';
```

## Tests

```bash
npm test          # unit and component tests (Dial, formatting, error mapping, forms)
npm run test:db   # database acceptance tests against a real Postgres
npm run lint
npm run build
```

`npm run test:db` creates and drops a database called `watch_test`. By default it connects as `postgres` to `localhost:5432` to create it, owned by a non-superuser role `neondb_owner` (password `pw`), to match Neon's privileges. Override with `TEST_PG_ADMIN`, `TEST_PG_OWNER`, `TEST_PG_OWNER_PW`. One-time setup on a local Postgres:

```sql
create role neondb_owner login createrole password 'pw';
```

## Project layout

```
api/rpc.ts              Vercel function: POST /api/rpc
server/                 actions, database access, auth, email, validation
shared/types.ts         types shared by API and app
src/                    the app (screens, components, lib)
db/migrations/          000_platform.sql (auth, roles), 001_core.sql (the original schema.sql)
db/seed/seed.csv        starter catalog
scripts/                migrate, seed, make-icons
tests/unit, tests/db    tests
```

## iPhone test checklist

Run on a real iPhone using the installed Home Screen app. Record results here.

| # | Check | Result |
|---|-------|--------|
| 1 | Open the site in Safari: install banner shows. Add to Home Screen, open the icon: banner gone. | |
| 2 | Create an account in the installed app. Force-quit and reopen: still signed in. Next day: still signed in. | |
| 3 | Reset password: request code, switch to Mail, copy code, return: the code step is still showing. Complete the reset. | |
| 4 | Password autofill works on sign in and sign up. | |
| 5 | Search with a typo, open a result, rate by tapping a dial marker, save. Entry is in My Diary and the feed. | |
| 6 | Add a watch that doesn't exist: the rating sheet opens on the new watch page. | |
| 7 | Rate the same watch again with an earlier date: both entries in My Diary; the average counts only the latest. | |
| 8 | Rotate the phone, increase text size, enable Reduce Motion: layouts hold, the dial hand doesn't animate. | |
| 9 | Airplane mode: the offline banner shows, nothing crashes. | |
| 10 | With a second account: can edit specs but not the reference of someone else's watch, and can't delete it. | |
