// tests/auth/scrypt.test.ts — the PATCH-09 suite: round-trip, rejection,
// per-call salt, and NFKC normalisation.
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../lib/auth/scrypt";

describe("scrypt", () => {
  it("round-trips", async () => { const h = await hashPassword("hunter2"); expect(await verifyPassword("hunter2", h)).toBe(true); });
  it("rejects wrong", async () => { const h = await hashPassword("hunter2"); expect(await verifyPassword("hunter3", h)).toBe(false); });
  it("salts differently", async () => { expect(await hashPassword("x")).not.toBe(await hashPassword("x")); });
  it("normalises unicode", async () => { const h = await hashPassword("café"); expect(await verifyPassword("cafe\u0301", h)).toBe(true); });
});
