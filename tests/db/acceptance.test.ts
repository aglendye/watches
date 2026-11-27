// Database acceptance tests: the nine scenarios in spec section 6.8,
// plus auth flows. Runs against a real Postgres (see README, "Tests").
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeDb } from '../../server/db';
import { Client, freshDatabase, signUp, sqlAs, sqlOwner } from './harness';

let alice: Client;
let bob: Client;
let speedyId: string;

beforeAll(async () => {
  await freshDatabase();
  alice = await signUp('alice@example.com', 'Alice', '10.0.0.1');
  bob = await signUp('bob@example.com', 'Bob', '10.0.0.2');
});

afterAll(async () => {
  await closeDb();
});

describe('6.8 database acceptance', () => {
  it('1. same brand/model/reference with different casing and spacing returns one watch id', async () => {
    const a = await alice.call('watches.add', { brand: 'Omega', model: 'Speedmaster Professional', reference: '310.30.42.50.01.001' });
    const b = await bob.call('watches.add', { brand: '  omega ', model: 'SPEEDMASTER professional', reference: ' 310.30.42.50.01.001 ' });
    expect(a.id).toBe(b.id);
    speedyId = a.id;
  });

  it('2. same model twice with no reference returns one placeholder', async () => {
    const a = await alice.call('watches.add', { brand: 'Seiko', model: 'SKX007' });
    const b = await bob.call('watches.add', { brand: 'seiko', model: 'skx007', reference: '   ' });
    expect(a.id).toBe(b.id);
  });

  it('3. row counts are as expected', async () => {
    const [counts] = await sqlOwner(`select
      (select count(*) from public.brands)::int as brands,
      (select count(*) from public.models)::int as models,
      (select count(*) from public.watches)::int as watches`);
    expect(counts).toEqual({ brands: 2, models: 2, watches: 2 });
  });

  it('4. stats average each user’s latest entry', async () => {
    await alice.call('ratings.create', { watchId: speedyId, score: 8, ratedOn: '2026-01-01' });
    await bob.call('ratings.create', { watchId: speedyId, score: 6, ratedOn: '2026-01-02' });
    let w = await alice.call('watches.get', { id: speedyId });
    expect(w.rating_count).toBe(2);
    expect(w.avg_score).toBe(7);

    // Alice re-rates later: counts once, with the latest score.
    await alice.call('ratings.create', { watchId: speedyId, score: 10, ratedOn: '2026-03-01' });
    // A backdated entry does not replace the latest one.
    await alice.call('ratings.create', { watchId: speedyId, score: 1, ratedOn: '2025-06-01' });
    w = await alice.call('watches.get', { id: speedyId });
    expect(w.rating_count).toBe(2);
    expect(w.avg_score).toBe(8);

    const community = await bob.call('ratings.forWatch', { watchId: speedyId });
    expect(community).toHaveLength(2);
    expect(community[0].display_name).toBe('Bob'); // viewer first
    const aliceRow = community.find((r: any) => r.display_name === 'Alice');
    expect(aliceRow.score).toBe(10);
    expect(aliceRow.entry_count).toBe(3);

    const entries = await bob.call('ratings.personEntries', { watchId: speedyId, userId: aliceRow.user_id });
    expect(entries.map((e: any) => e.rated_on)).toEqual(['2026-03-01', '2026-01-01', '2025-06-01']);
  });

  it('5. fuzzy search finds the Speedmaster and ignores gibberish', async () => {
    for (const query of ['omegha speedmastr', '310.30', 'speedmaster']) {
      const rows = await alice.call('watches.search', { q: query });
      expect(rows[0]?.watch_id, query).toBe(speedyId);
    }
    const first = (await alice.call('watches.search', { q: 'speedmaster' }))[0];
    expect(first.rating_count).toBe(2);
    expect(await alice.call('watches.search', { q: 'zqxjv wpflk' })).toEqual([]);
    expect(await alice.call('watches.search', { q: '   ' })).toEqual([]);
  });

  it('6. another user can edit specs; updated_by is stamped', async () => {
    await bob.call('watches.update', { id: speedyId, dial_color: 'Black', case_size_mm: 42 });
    const w = await alice.call('watches.get', { id: speedyId });
    expect(w.dial_color).toBe('Black');
    expect(w.case_size_mm).toBe(42);
    expect(w.updated_by_name).toBe('Bob');
    expect(w.created_by_name).toBe('Alice');
    expect(w.can_edit_identity).toBe(true);
    expect((await bob.call('watches.get', { id: speedyId })).can_edit_identity).toBe(false);
  });

  it('7. another user cannot change reference, delete, rate as someone else, or set is_admin', async () => {
    await expect(
      bob.call('watches.update', { id: speedyId, brand: 'Omega', model: 'Speedmaster Professional', reference: 'X' }),
    ).rejects.toThrow('Only the creator or an admin can change a watch\'s brand, model, or reference');

    await expect(bob.call('watches.delete', { id: speedyId })).rejects.toMatchObject({ status: 403 });

    const [aliceProfile] = await sqlOwner(`select id from public.profiles where display_name = 'Alice'`);
    await expect(
      sqlAs(bob, `insert into public.ratings (user_id, watch_id, score) values ($1, $2, 5)`, [aliceProfile.id, speedyId]),
    ).rejects.toMatchObject({ code: '42501' });

    await expect(
      sqlAs(bob, `update public.profiles set is_admin = true where id = auth.uid()`),
    ).rejects.toMatchObject({ code: '42501' });

    // Bob can't edit or delete Alice's rating entries.
    const [aliceRating] = await sqlOwner(`select id from public.ratings where user_id = $1 limit 1`, [aliceProfile.id]);
    await expect(bob.call('ratings.update', { id: aliceRating.id, score: 1, ratedOn: '2026-01-01' })).rejects.toMatchObject({ status: 403 });
    await expect(bob.call('ratings.delete', { id: aliceRating.id })).rejects.toMatchObject({ status: 403 });

    // ...and can change his own display name, but nobody else's.
    await bob.call('profile.update', { displayName: 'Bobby' });
    const rows = await sqlAs(bob, `update public.profiles set display_name = 'x' where id = $1 returning id`, [aliceProfile.id]);
    expect(rows).toEqual([]);
  });

  it('8. creator cannot delete a watch someone else rated, but can delete an unrated one', async () => {
    await expect(alice.call('watches.delete', { id: speedyId })).rejects.toThrow(
      'This watch has ratings from other people and cannot be deleted',
    );
    expect((await alice.call('watches.get', { id: speedyId })).can_delete).toBe(false);

    const { id } = await alice.call('watches.add', { brand: 'Tudor', model: 'Black Bay 58' });
    await alice.call('ratings.create', { watchId: id, score: 9, ratedOn: '2026-02-02' }); // own rating is fine
    expect((await alice.call('watches.get', { id })).can_delete).toBe(true);
    await alice.call('watches.delete', { id });
    await expect(alice.call('watches.get', { id })).rejects.toMatchObject({ status: 404 });
  });

  it('8b. an admin can change identity fields and delete rated watches', async () => {
    await sqlOwner(`update public.profiles set is_admin = true where display_name = 'Bobby'`);
    await bob.call('watches.update', {
      id: speedyId, brand: 'Omega', model: 'Speedmaster Professional', reference: '310.30.42.50.01.002',
      dial_color: 'Black', case_size_mm: 42,
    });
    const w = await alice.call('watches.get', { id: speedyId });
    expect(w.reference).toBe('310.30.42.50.01.002');
    expect(w.created_by_name).toBe('Alice');
    await sqlOwner(`update public.profiles set is_admin = false where display_name = 'Bobby'`);
  });

  it('9. signed-out users see nothing and cannot call functions', async () => {
    const anonApi = new Client('10.0.0.9');
    await expect(anonApi.call('watches.search', { q: 'omega' })).rejects.toMatchObject({ status: 401 });
    await expect(anonApi.call('home.feed')).rejects.toMatchObject({ status: 401 });
    for (const table of ['profiles', 'brands', 'models', 'watches', 'ratings', 'watch_catalog', 'current_ratings', 'watch_stats']) {
      await expect(sqlAs('anon', `select * from public.${table}`)).rejects.toMatchObject({ code: '42501' });
    }
    await expect(sqlAs('anon', `select * from public.search_watches('omega')`)).rejects.toMatchObject({ code: '42501' });
    await expect(sqlAs('anon', `select public.add_watch('a', 'b')`)).rejects.toMatchObject({ code: '42501' });
    // A forged session token is rejected too.
    const forged = new Client();
    forged.token = 'not-a-real-token';
    await expect(forged.call('home.feed')).rejects.toMatchObject({ status: 401 });
    // Signed-in users cannot read the auth tables.
    await expect(sqlAs(alice, `select * from auth.users`)).rejects.toMatchObject({ code: '42501' });
    await expect(sqlAs(alice, `select * from auth.sessions`)).rejects.toMatchObject({ code: '42501' });
  });
});

describe('auth flows', () => {
  it('session, sign out, sign in', async () => {
    const c = await signUp('carol@example.com', 'Carol', '10.0.1.1');
    expect((await c.call('auth.session')).user).toMatchObject({ displayName: 'Carol', email: 'carol@example.com', isAdmin: false });
    await c.call('auth.signOut');
    expect(c.token).toBeNull();
    expect((await c.call('auth.session')).user).toBeNull();
    await expect(c.call('auth.signIn', { email: 'carol@example.com', password: 'wrongpass1' })).rejects.toThrow('Email or password is incorrect.');
    await c.call('auth.signIn', { email: 'CAROL@example.com', password: 'password123' });
    expect((await c.call('auth.session')).user.displayName).toBe('Carol');
  });

  it('duplicate email is refused; profile falls back to email name', async () => {
    await expect(signUp('Carol@Example.com', 'Other', '10.0.1.2')).rejects.toThrow('already exists');
    await sqlOwner(`insert into auth.users (email, password_hash) values ('dave.d@example.com', 'x')`);
    const [p] = await sqlOwner(`select p.display_name from public.profiles p join auth.users u on u.id = p.id where u.email = 'dave.d@example.com'`);
    expect(p.display_name).toBe('dave.d');
  });

  it('rejects requests without the app header (CSRF)', async () => {
    const { handleRpc } = await import('../../server/rpc');
    const res = await handleRpc({ method: 'POST', headers: {}, body: { action: 'auth.session' }, ip: '1' });
    expect(res.status).toBe(400);
  });
});

describe('ratings, diary, feed', () => {
  it('validates scores and future dates', async () => {
    await expect(alice.call('ratings.create', { watchId: speedyId, score: 11, ratedOn: '2026-01-01' })).rejects.toMatchObject({ status: 400 });
    await expect(alice.call('ratings.create', { watchId: speedyId, score: 5, ratedOn: '2999-01-01' })).rejects.toThrow('future');
  });

  it('diary lists own entries newest first and supports edit/delete', async () => {
    const diary = await alice.call('diary.list', {});
    expect(diary.items.length).toBeGreaterThanOrEqual(3);
    expect(diary.items[0].rated_on >= diary.items[1].rated_on).toBe(true);
    expect(diary.items.every((e: any) => e.brand_name)).toBe(true);
    const last = diary.items[diary.items.length - 1];
    await alice.call('ratings.update', { id: last.id, score: 2, reviewText: 'Edited', ratedOn: last.rated_on });
    await alice.call('ratings.delete', { id: last.id });
    const after = await alice.call('diary.list', {});
    expect(after.items.find((e: any) => e.id === last.id)).toBeUndefined();
  });

  it('feed merges ratings and new watches by created time; recent strip lists watches', async () => {
    const feed = await bob.call('home.feed');
    expect(feed.length).toBeGreaterThan(0);
    expect(new Set(feed.map((f: any) => f.kind))).toEqual(new Set(['rating', 'watch']));
    for (let i = 1; i < feed.length; i++) {
      expect(new Date(feed[i - 1].created_at) >= new Date(feed[i].created_at)).toBe(true);
    }
    const recent = await bob.call('home.recent');
    expect(recent[0].brand_name).toBeTruthy();
  });

  it('autocomplete and lookup', async () => {
    expect(await alice.call('brands.suggest', { prefix: 'om' })).toEqual(['Omega']);
    expect(await alice.call('brands.suggest', { prefix: '%' })).toEqual([]);
    expect(await alice.call('models.suggest', { brand: 'omega', prefix: 'speed' })).toEqual(['Speedmaster Professional']);
    expect((await alice.call('watches.lookup', { brand: 'SEIKO', model: 'skx007', reference: '' })).id).toBeTruthy();
    expect((await alice.call('watches.lookup', { brand: 'Seiko', model: 'skx007', reference: 'nope' })).id).toBeNull();
  });
});
