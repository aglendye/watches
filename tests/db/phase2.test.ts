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
