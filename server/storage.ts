// Photo file storage. Production uses a private Vercel Blob store (the SDK
// authenticates with the project's OIDC token + BLOB_STORE_ID, or with
// BLOB_READ_WRITE_TOKEN). Local development without Blob credentials keeps
// files in ./.local-blobs; tests swap in an in-memory store.
import { del, get, put } from '@vercel/blob';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export type StoredFile =
  | { status: 200; body: ReadableStream<Uint8Array> | Uint8Array; etag: string; contentType: string }
  | { status: 304; etag: string };

export interface Storage {
  put(pathname: string, data: Uint8Array, contentType: string): Promise<void>;
  get(pathname: string, ifNoneMatch?: string): Promise<StoredFile | null>;
  del(pathnames: string[]): Promise<void>;
}

const ONE_YEAR = 365 * 24 * 3600;

export const blobStorage: Storage = {
  async put(pathname, data, contentType) {
    await put(pathname, Buffer.from(data), {
      access: 'private',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: false,
      // Paths are never reused, so the CDN cache between the function and the
      // store can keep them; cache hits don't count against the free quota.
      cacheControlMaxAge: ONE_YEAR,
    });
  },
  async get(pathname, ifNoneMatch) {
    const r = await get(pathname, { access: 'private', ifNoneMatch });
    if (!r) return null;
    if (r.statusCode === 304) return { status: 304, etag: r.blob.etag };
    return { status: 200, body: r.stream, etag: r.blob.etag, contentType: r.blob.contentType };
  },
  async del(pathnames) {
    if (pathnames.length) await del(pathnames);
  },
};

const etagOf = (b: Uint8Array) => `"${createHash('sha1').update(b).digest('hex')}"`;

export function memoryStorage(): Storage & { files: Map<string, Uint8Array> } {
  const files = new Map<string, Uint8Array>();
  return {
    files,
    async put(p, data) {
      if (files.has(p)) throw new Error('exists');
      files.set(p, data);
    },
    async get(p, ifNoneMatch) {
      const f = files.get(p);
      if (!f) return null;
      const etag = etagOf(f);
      return ifNoneMatch === etag ? { status: 304, etag } : { status: 200, body: f, etag, contentType: 'image/jpeg' };
    },
    async del(ps) {
      for (const p of ps) files.delete(p);
    },
  };
}

export function folderStorage(root = path.resolve('.local-blobs')): Storage {
  const file = (p: string) => path.join(root, ...p.split('/'));
  return {
    async put(p, data) {
      await mkdir(path.dirname(file(p)), { recursive: true });
      await writeFile(file(p), data, { flag: 'wx' });
    },
    async get(p, ifNoneMatch) {
      try {
        const data = new Uint8Array(await readFile(file(p)));
        const etag = etagOf(data);
        return ifNoneMatch === etag ? { status: 304, etag } : { status: 200, body: data, etag, contentType: 'image/jpeg' };
      } catch {
        return null;
      }
    },
    async del(ps) {
      for (const p of ps) await rm(file(p), { force: true });
    },
  };
}

function hasBlobCredentials() {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

let current: Storage | null = null;

export function storage(): Storage {
  current ??= hasBlobCredentials() || process.env.VERCEL ? blobStorage : folderStorage();
  return current;
}

/** For tests and local development. */
export function setStorage(s: Storage | null) {
  current = s;
}
