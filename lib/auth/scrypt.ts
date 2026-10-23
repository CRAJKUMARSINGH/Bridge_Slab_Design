// lib/auth/scrypt.ts — password hashing on the Node builtin.
//
// Chosen over `argon2`/`@node-rs/argon2` because the deployed target is Netlify
// Functions, where a native build is the thing that breaks, not the thing that
// helps. `node:crypto` is zero-dependency and present in Node 20/22/24.
// Decision: ADR-0009 is reserved and not yet written (see docs/adr/README.md);
// the opening record is DL-004 in CODE-JUNCTION/VENICE-GUIDE.MD (2026-10-23).
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const N = 16384, r = 8, p = 1, KEYLEN = 64;
const kdf = (pw: string, salt: Buffer) =>
  new Promise<Buffer>((res, rej) =>
    scrypt(pw.normalize("NFKC"), salt, KEYLEN, { N, r, p, maxmem: 128 * N * r * 2 },
      (e, k) => (e ? rej(e) : res(k))));

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await kdf(pw, salt);
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts[0] !== "scrypt") return false;
  const [, , , , salt, key] = parts;
  const derived = await kdf(pw, Buffer.from(salt, "base64"));
  const expected = Buffer.from(key, "base64");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export const needsRehash = (stored: string) =>
  Number(stored.split("$")[1]) < N || Number(stored.split("$")[2]) < r;
