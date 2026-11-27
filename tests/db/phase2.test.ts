// Phase 2 database tests: ownership (M7), lists (M8) and photos (M9).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeDb } from '../../server/db';
import { Client, freshDatabase, signUp, sqlAs, sqlOwner } from './harness';

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
