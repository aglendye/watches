// Phase 2 database tests: ownership (M7), lists (M8) and photos (M9).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeDb } from '../../server/db';
import { Client, freshDatabase, signUp, sqlAs, sqlOwner } from './harness';
import { handlePhoto, handleUpload } from '../../server/photos';
import { memoryStorage, setStorage } from '../../server/storage';

let alice: Client;
let bob: Client;
let admin: Client;
let watchId: string;

beforeAll(async () => {
  await freshDatabase();
  alice = await signUp('alice@example.com', 'Alice', '10.0.0.1');
  bob = await signUp('bob@example.com', 'Bob', '10.0.0.2');
  admin = await signUp('admin@example.com', 'Admin', '10.0.0.3');
  await sqlOwner(`update public.profiles set is_admin = true where display_name = 'Admin'`);
  watchId = (await alice.call('watches.add', { brand: 'Rolex', model: 'GMT-Master II', reference: '116710BLNR', nickname: 'Batman' })).id;
});

afterAll(async () => {
  await closeDb();
});

describe('M7 ownership', () => {
  let bobOwnership: string;

  it('anyone can own a watch, twice; dates and notes are optional', async () => {
    bobOwnership = (await bob.call('ownerships.create', { watchId, acquiredOn: '2020-05-01', notes: 'Box and papers' })).id;
    await bob.call('ownerships.create', { watchId });
    await alice.call('ownerships.create', { watchId, acquiredOn: '2015-01-01', soldOn: '2019-06-01' });
    const owners = await alice.call('ownerships.forWatch', { watchId });
    expect(owners).toHaveLength(3);
    // current owners first, the sold one last
    expect(owners[2]).toMatchObject({ display_name: 'Alice', sold_on: '2019-06-01' });
    expect(owners.slice(0, 2).every((o: any) => o.display_name === 'Bob' && o.sold_on === null)).toBe(true);
  });

  it('my collection joins the watch and only shows my rows', async () => {
    const mine = await bob.call('ownerships.mine');
    expect(mine).toHaveLength(2);
    expect(mine[0]).toMatchObject({ brand_name: 'Rolex', model_name: 'GMT-Master II', acquired_on: '2020-05-01', notes: 'Box and papers' });
    expect(mine[0].extras.nickname).toBe('Batman');
  });

  it('rejects a sold date before the acquired date, in the API and the database', async () => {
    await expect(bob.call('ownerships.create', { watchId, acquiredOn: '2020-01-02', soldOn: '2020-01-01' })).rejects.toThrow('before the acquired');
    await expect(
      sqlAs(bob, `insert into public.ownerships (watch_id, acquired_on, sold_on) values ($1, '2020-01-02', '2020-01-01')`, [watchId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(bob.call('ownerships.create', { watchId, acquiredOn: '2999-01-01' })).rejects.toThrow('future');
    await expect(bob.call('ownerships.create', { watchId, notes: 'x'.repeat(1001) })).rejects.toMatchObject({ status: 400 });
  });

  it('only the owner can edit or delete an ownership, or insert one for themselves', async () => {
    await expect(alice.call('ownerships.update', { id: bobOwnership, soldOn: '2021-01-01' })).rejects.toMatchObject({ status: 403 });
    await expect(alice.call('ownerships.delete', { id: bobOwnership })).rejects.toMatchObject({ status: 403 });
    const [b] = await sqlOwner(`select id from public.profiles where display_name = 'Bob'`);
    await expect(
      sqlAs(alice, `insert into public.ownerships (user_id, watch_id) values ($1, $2)`, [b.id, watchId]),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      sqlAs(bob, `update public.ownerships set user_id = (select id from public.profiles where display_name = 'Alice') where id = $1`, [bobOwnership]),
    ).rejects.toMatchObject({ code: '42501' });

    await bob.call('ownerships.update', { id: bobOwnership, acquiredOn: '2020-05-01', soldOn: '2024-01-01', notes: 'Sold to a friend' });
    const [row] = await bob.call('ownerships.mine').then((m: any[]) => m.filter((o) => o.id === bobOwnership));
    expect(row).toMatchObject({ sold_on: '2024-01-01', notes: 'Sold to a friend' });
  });

  it('ownership is not in the feed', async () => {
    const feed = await bob.call('home.feed');
    expect(feed.every((f: any) => f.kind !== 'ownership')).toBe(true);
  });

  it("someone else's ownership blocks the creator deleting the watch; admins can", async () => {
    const { id } = await alice.call('watches.add', { brand: 'Tudor', model: 'Black Bay 58' });
    await alice.call('ownerships.create', { watchId: id }); // own row is fine
    expect((await alice.call('watches.get', { id })).can_delete).toBe(true);
    const own = await bob.call('ownerships.create', { watchId: id });
    expect((await alice.call('watches.get', { id })).can_delete).toBe(false);
    await expect(alice.call('watches.delete', { id })).rejects.toThrow('Other people have');
    await bob.call('ownerships.delete', { id: own.id });
    await alice.call('watches.delete', { id });

    const { id: id2 } = await alice.call('watches.add', { brand: 'Tudor', model: 'Pelagos' });
    await bob.call('ownerships.create', { watchId: id2 });
    expect((await admin.call('watches.get', { id: id2 })).can_delete).toBe(true);
    await admin.call('watches.delete', { id: id2 });
  });
});

describe('M8 lists', () => {
  let grails: string;
  let omegaId: string;

  it('create a list with a watch in it, then add, note and remove items', async () => {
    omegaId = (await bob.call('watches.add', { brand: 'Omega', model: 'Speedmaster Professional' })).id;
    grails = (await bob.call('lists.create', { name: '  Grails ', description: 'One day', watchId })).id;
    await bob.call('listItems.add', { listId: grails, watchId: omegaId });
    await bob.call('listItems.add', { listId: grails, watchId: omegaId }); // twice is a no-op
    await bob.call('listItems.updateNote', { listId: grails, watchId: omegaId, note: 'Moonwatch' });
    const l = await alice.call('lists.get', { id: grails });
    expect(l).toMatchObject({ name: 'Grails', description: 'One day', display_name: 'Bob', is_mine: false });
    expect(l.items.map((i: any) => i.model_name)).toEqual(['Speedmaster Professional', 'GMT-Master II']); // newest first
    expect(l.items[0].note).toBe('Moonwatch');
    expect(l.items[1].extras.nickname).toBe('Batman');

    const forWatch = await bob.call('lists.forWatch', { watchId: omegaId });
    expect(forWatch).toEqual([{ id: grails, name: 'Grails', item_count: 2, contains: true }]);
    expect(await alice.call('lists.forWatch', { watchId: omegaId })).toEqual([]);
  });

  it('a watch appears once per list', async () => {
    await expect(
      sqlAs(bob, `insert into public.list_items (list_id, watch_id) values ($1, $2)`, [grails, watchId]),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('index shows everyone’s lists, mine first, with counts and previews', async () => {
    const mineId = (await alice.call('lists.create', { name: 'Wishlist' })).id;
    const idx = await alice.call('lists.index');
    expect(idx.map((x: any) => x.name)).toEqual(['Wishlist', 'Grails']);
    expect(idx[0]).toMatchObject({ is_mine: true, item_count: 0, preview: [] });
    expect(idx[1]).toMatchObject({ is_mine: false, display_name: 'Bob', item_count: 2 });
    expect(idx[1].preview[0].model_name).toBe('Speedmaster Professional');
    await alice.call('lists.delete', { id: mineId });
  });

  it('only the owner can change a list or its items', async () => {
    await expect(alice.call('lists.update', { id: grails, name: 'Mine now' })).rejects.toMatchObject({ status: 403 });
    await expect(alice.call('lists.delete', { id: grails })).rejects.toMatchObject({ status: 403 });
    await expect(alice.call('listItems.add', { listId: grails, watchId })).rejects.toMatchObject({ status: 403 });
    await expect(alice.call('listItems.remove', { listId: grails, watchId: omegaId })).rejects.toMatchObject({ status: 403 });
    await expect(alice.call('listItems.updateNote', { listId: grails, watchId: omegaId, note: 'x' })).rejects.toMatchObject({ status: 403 });
    await expect(
      sqlAs(alice, `insert into public.list_items (list_id, watch_id) values ($1, $2)`, [grails, (await alice.call('watches.add', { brand: 'Seiko', model: 'SKX007' })).id]),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      sqlAs(bob, `update public.lists set user_id = (select id from public.profiles where display_name = 'Alice') where id = $1 returning user_id`, [grails]),
    ).resolves.toEqual([expect.objectContaining({ user_id: expect.any(String) })]);
    // ...but the owner never changes (trigger keeps it):
    const [row] = await sqlOwner(`select p.display_name from public.lists l join public.profiles p on p.id = l.user_id where l.id = $1`, [grails]);
    expect(row.display_name).toBe('Bob');

    await expect(bob.call('lists.create', { name: '   ' })).rejects.toMatchObject({ status: 400 });
    await expect(bob.call('lists.create', { name: 'x'.repeat(81) })).rejects.toMatchObject({ status: 400 });
    await expect(bob.call('listItems.updateNote', { listId: grails, watchId: omegaId, note: 'x'.repeat(281) })).rejects.toMatchObject({ status: 400 });
    await bob.call('lists.update', { id: grails, name: 'Grails', description: '' });
    expect((await bob.call('lists.get', { id: grails })).description).toBeNull();
  });

  it('the feed shows new lists, linked by id', async () => {
    const feed = await alice.call('home.feed');
    const item = feed.find((f: any) => f.kind === 'list');
    expect(item).toMatchObject({ list_id: grails, list_name: 'Grails', display_name: 'Bob', watch_id: null });
  });

  it("someone else's list blocks the creator deleting the watch", async () => {
    // Alice created the Batman; Bob's list holds it (and Bob owns it, from M7).
    const { id } = await alice.call('watches.add', { brand: 'Tudor', model: 'Ranger' });
    await bob.call('listItems.add', { listId: grails, watchId: id });
    expect((await alice.call('watches.get', { id })).can_delete).toBe(false);
    await expect(alice.call('watches.delete', { id })).rejects.toThrow('Other people have');
    await bob.call('listItems.remove', { listId: grails, watchId: id });
    await alice.call('watches.delete', { id });
  });

  it('deleting a list removes its items', async () => {
    const tmp = (await bob.call('lists.create', { name: 'Temp', watchId: omegaId })).id;
    await bob.call('lists.delete', { id: tmp });
    const [n] = await sqlOwner('select count(*)::int as n from public.list_items where list_id = $1', [tmp]);
    expect(n.n).toBe(0);
    await expect(bob.call('lists.get', { id: tmp })).rejects.toMatchObject({ status: 404 });
  });
});

describe('M9 photos', () => {
  const files = memoryStorage();
  const jpeg = (n = 1000) => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(n).fill(7)]);
  let watch2: string;

  function upload(c: Client | null, watch: string, body: Uint8Array = jpeg(), type = 'image/jpeg') {
    return handleUpload({
      method: 'POST',
      headers: {
        'x-requested-with': 'watch-app',
        'content-type': type,
        cookie: c?.token ? `wr_session=${encodeURIComponent(c.token)}` : undefined,
      },
      query: new URLSearchParams({ watchId: watch, w: '1600', h: '1200' }),
      body,
    });
  }
  function fetchPhoto(c: Client | null, url: string, etag?: string) {
    return handlePhoto({
      method: 'GET',
      headers: { cookie: c?.token ? `wr_session=${encodeURIComponent(c.token)}` : undefined, 'if-none-match': etag },
      query: new URL(url, 'http://x').searchParams,
    });
  }
  const data = (r: { body: unknown }) => (r.body as { data: any }).data;

  beforeAll(async () => {
    setStorage(files);
    watch2 = (await alice.call('watches.add', { brand: 'Omega', model: 'Seamaster 300M' })).id;
  });

  it('uploads go to storage and the oldest photo becomes primary everywhere', async () => {
    const first = await upload(alice, watch2);
    expect(first.status).toBe(200);
    const a = data(first);
    expect(files.files.has(`watch-images/${watch2}/${a.id}.jpg`)).toBe(true);
    await new Promise((r) => setTimeout(r, 10));
    const b = data(await upload(bob, watch2));

    const w = await bob.call('watches.get', { id: watch2 });
    expect(w.primary_image_url).toBe(a.url);
    const photos = await bob.call('photos.forWatch', { watchId: watch2 });
    expect(photos.map((x: any) => [x.id, x.display_name, x.can_delete, x.width])).toEqual([
      [a.id, 'Alice', false, 1600],
      [b.id, 'Bob', true, 1600],
    ]);
    const hits = await bob.call('watches.search', { q: 'seamaster 300m' });
    expect(hits.find((h: any) => h.watch_id === watch2).primary_image_url).toBe(a.url);
    expect((await bob.call('home.recent')).find((h: any) => h.watch_id === watch2).primary_image_url).toBe(a.url);

    const feed = await alice.call('home.feed');
    const item = feed.find((f: any) => f.kind === 'photo' && f.id === b.id);
    expect(item).toMatchObject({ display_name: 'Bob', watch_id: watch2, image_url: b.url, model_name: 'Seamaster 300M' });
  });

  it('serves photos to signed-in users only, with an ETag for revalidation', async () => {
    const [p] = await alice.call('photos.forWatch', { watchId: watch2 });
    const ok = await fetchPhoto(bob, p.url);
    expect(ok.status).toBe(200);
    expect(ok.headers['Content-Type']).toBe('image/jpeg');
    expect(ok.headers['Cache-Control']).toMatch(/^private/);
    expect((await fetchPhoto(bob, p.url, ok.headers.ETag)).status).toBe(304);
    expect((await fetchPhoto(null, p.url)).status).toBe(401);
    expect((await fetchPhoto(bob, '/api/photo?id=00000000-0000-0000-0000-000000000000')).status).toBe(404);
  });

  it('rejects bad uploads', async () => {
    expect((await upload(null, watch2)).status).toBe(401);
    expect((await upload(alice, watch2, new Uint8Array([1, 2, 3, 4]))).status).toBe(400);
    expect((await upload(alice, watch2, jpeg(), 'image/png')).status).toBe(400);
    expect((await upload(alice, watch2, jpeg(4 * 1024 * 1024))).status).toBe(413);
    expect((await upload(alice, '00000000-0000-0000-0000-000000000000')).status).toBe(404);
    const noHeader = await handleUpload({ method: 'POST', headers: { 'content-type': 'image/jpeg' }, query: new URLSearchParams({ watchId: watch2 }), body: jpeg() });
    expect(noHeader.status).toBe(400);
  });

  it('only the uploader or an admin deletes; deleting the primary promotes the next oldest', async () => {
    const [a, b] = await alice.call('photos.forWatch', { watchId: watch2 });
    await expect(bob.call('photos.delete', { id: a.id })).rejects.toMatchObject({ status: 403 });
    await expect(sqlAs(bob, 'update public.watch_images set uploaded_by = auth.uid() where id = $1', [a.id])).rejects.toMatchObject({ code: '42501' });
    await alice.call('photos.delete', { id: a.id });
    expect(files.files.has(`watch-images/${watch2}/${a.id}.jpg`)).toBe(false);
    expect((await bob.call('watches.get', { id: watch2 })).primary_image_url).toBe(b.url);
    // an admin can delete anyone's
    const c = data(await upload(alice, watch2));
    await admin.call('photos.delete', { id: c.id });
    expect((await bob.call('photos.forWatch', { watchId: watch2 })).map((x: any) => x.id)).toEqual([b.id]);
  });

  it("someone else's photo blocks the creator deleting the watch; deleting a watch removes its files", async () => {
    // Bob's photo is on Alice's watch.
    expect((await alice.call('watches.get', { id: watch2 })).can_delete).toBe(false);
    await expect(alice.call('watches.delete', { id: watch2 })).rejects.toThrow('Other people have');
    const [b] = await bob.call('photos.forWatch', { watchId: watch2 });
    await admin.call('watches.delete', { id: watch2 });
    expect(files.files.has(`watch-images/${watch2}/${b.id}.jpg`)).toBe(false);
    expect((await sqlOwner('select count(*)::int as n from public.watch_images where watch_id = $1', [watch2]))[0].n).toBe(0);

    // Own photos don't block.
    const { id } = await alice.call('watches.add', { brand: 'Omega', model: 'Aqua Terra' });
    await upload(alice, id);
    expect((await alice.call('watches.get', { id })).can_delete).toBe(true);
    await alice.call('watches.delete', { id });
  });
});

describe('review fixes: seed activity, nicknames, people, browsing', () => {
  it('watches added by the seed account stay out of the feed and Recently added', async () => {
    // Load two watches through the real seed statements (creates the seed account).
    // @ts-expect-error plain JS script
    const { chunkStatements, parseCsv } = await import('../../scripts/seed.mjs');
    const csv = 'brand,model,reference,nickname,aka,note\nSeedwerk,Diver,SW-1,Hulk,Kermit,Test note\nSeedwerk,Pilot,SW-2,,,';
    const pg = (await import('pg')).default;
    const { TEST_URL } = await import('./harness');
    const c = new pg.Client({ connectionString: TEST_URL });
    await c.connect();
    await c.query('begin');
    for (const stmt of chunkStatements(parseCsv(csv)) as string[]) await c.query(stmt);
    await c.query('commit');
    await c.end();

    const [seed] = await sqlOwner(`select is_system from public.profiles where display_name = 'Seed catalog'`);
    expect(seed.is_system).toBe(true);
    const feed = await alice.call('home.feed');
    expect(feed.some((f: any) => f.brand_name === 'Seedwerk')).toBe(false);
    expect(feed.some((f: any) => f.kind === 'watch')).toBe(true); // people's watches still show
    const recent = await alice.call('home.recent');
    expect(recent.some((w: any) => w.brand_name === 'Seedwerk')).toBe(false);
    expect(recent.length).toBeGreaterThan(0);

    // aka is searchable; extras hold aka and note
    const hits = await alice.call('watches.search', { q: 'seedwerk kermit' });
    expect(hits[0]).toMatchObject({ model_name: 'Diver', nickname: 'Hulk' });
    expect(hits[0].extras).toMatchObject({ aka: 'Kermit', note: 'Test note' });

    // people can't flag themselves as system
    await expect(sqlAs(bob, 'update public.profiles set is_system = true where id = auth.uid()')).rejects.toMatchObject({ code: '42501' });
    // and system accounts have no person page
    const [s] = await sqlOwner(`select id from public.profiles where display_name = 'Seed catalog'`);
    await expect(alice.call('people.get', { id: s.id })).rejects.toMatchObject({ status: 404 });
  });

  it('the seed tool flags nicknames that aren’t one short name', async () => {
    // @ts-expect-error plain JS script
    const { nicknameProblem } = await import('../../scripts/seed.mjs');
    expect(nicknameProblem({ nickname: 'Batman' })).toBeNull();
    expect(nicknameProblem({ nickname: '' })).toBeNull();
    expect(nicknameProblem({ nickname: 'Zombie; Bumblebee' })).toMatch(/aka/);
    expect(nicknameProblem({ nickname: 'Polar (white dial)' })).toMatch(/aka/);
    expect(nicknameProblem({ nickname: 'Pepsi / Coke' })).toMatch(/aka/);
    expect(nicknameProblem({ nickname: 'Silver Snoopy Award 50th Anniversary' })).toMatch(/24/);
  });

  it('person pages: everyone listed (me first), with ratings best first, collection and lists', async () => {
    const people = await bob.call('people.index');
    expect(people[0].display_name).toBe('Bob');
    expect(people.map((p: any) => p.display_name)).not.toContain('Seed catalog');

    const [a] = await sqlOwner(`select id from public.profiles where display_name = 'Alice'`);
    await alice.call('ratings.create', { watchId, score: 6, ratedOn: '2026-01-01' });
    const omega = (await alice.call('watches.add', { brand: 'Omega', model: 'Speedmaster Professional' })).id;
    await alice.call('ratings.create', { watchId: omega, score: 9, ratedOn: '2026-02-01' });
    const page = await bob.call('people.get', { id: a.id });
    expect(page).toMatchObject({ display_name: 'Alice', is_me: false, avg_score: 7.5 });
    expect(page.ratings.map((r: any) => r.score)).toEqual([9, 6]);
    expect(page.ratings[1].extras.nickname).toBe('Batman');
    expect(page.collection.length).toBeGreaterThan(0);
    expect(Array.isArray(page.lists)).toBe(true);
    expect((await alice.call('people.get', { id: a.id })).is_me).toBe(true);
  });

  it('browse: brands -> models -> references', async () => {
    const brands = await alice.call('catalog.brands');
    const rolex = brands.find((b: any) => b.name === 'Rolex');
    expect(rolex.watch_count).toBeGreaterThan(0);
    const brand = await alice.call('catalog.brand', { id: rolex.id });
    const gmt = brand.models.find((m: any) => m.name === 'GMT-Master II');
    expect(gmt.sample.brand_name).toBe('Rolex');
    expect(gmt.rating_count).toBeGreaterThanOrEqual(1);
    const model = await alice.call('catalog.model', { id: gmt.id });
    expect(model).toMatchObject({ name: 'GMT-Master II', brand_name: 'Rolex' });
    expect(model.watches[0]).toMatchObject({ watch_reference: '116710BLNR', nickname: 'Batman' });
    await expect(alice.call('catalog.brand', { id: '00000000-0000-0000-0000-000000000000' })).rejects.toMatchObject({ status: 404 });
  });
});
