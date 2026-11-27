// Prints a password hash in the app's format, for resetting a forgotten password by hand.
// Usage: npm run hash-password -- 'their-new-password'
// Must match hashPassword() in server/security.ts.
import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Give a password of at least 8 characters, in quotes.');
  process.exit(1);
}
const N = 16384;
const r = 8;
const p = 1;
const salt = randomBytes(16);
const key = scryptSync(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
console.log(`scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`);
