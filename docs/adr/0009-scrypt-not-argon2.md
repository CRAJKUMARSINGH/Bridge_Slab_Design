# ADR-0009 — Password hashing: node:crypto scrypt, not argon2

Status: ACCEPTED
Date:   2026-10-23
Week:   W00
Supersedes: none

## Context

The Phase-2 foundation week found the authentication surface unimplemented: there
was a plan for password hashing and no code. The plan named `argon2` and the
`@node-rs/argon2` binding.

The deployment target is Netlify Functions. A native binding is the component
most likely to break at deploy time and the least likely to be testable in CI in
the same shape as it runs in production. `node:crypto` is present in every Node
version this repository pins (20 / 22 / 24 per [.nvmrc](../../.nvmrc) and
[.github/workflows/ci.yml](../../.github/workflows/ci.yml)) and needs no build
step.

The opening record for this decision is `DL-004` in
[CODE-JUNCTION/VENICE-GUIDE.MD](../../CODE-JUNCTION/VENICE-GUIDE.MD) — "Password
hashing = crypto.scrypt, not argon2 | zero native build on serverless | Kiro |
ACCEPTED | ADR-0009".

## Decision

**`node:crypto` `scrypt` is the password KDF.** Parameters are fixed at
`N = 16384, r = 8, p = 1, keylen = 64` with a 16-byte random salt, and the stored
string is self-describing: `scrypt$N$r$p$salt$key`, both parts base64. Passwords
are NFKC-normalised before derivation so that a composed and a decomposed
encoding of the same password do not become two different passwords.

The implementation is [lib/auth/scrypt.ts](../../lib/auth/scrypt.ts); its test is
[tests/auth/scrypt.test.ts](../../tests/auth/scrypt.test.ts). `argon2` and
`@node-rs/argon2` are not installed and are not recorded in
[.deps-plan.json](../../.deps-plan.json).

## Consequences

- No native build on the serverless target; no `node-gyp` in CI.
- The parameters live in the stored hash rather than in configuration, so
  `needsRehash` can migrate a weaker row to the current cost without a flag day.
- Verification is a constant-time compare (`timingSafeEqual`) over equal-length
  buffers; a stored value that does not parse returns `false` rather than
  throwing.
- scrypt is memory-hard but not as costly for an attacker with GPUs as argon2id
  at comparable wall-clock cost. This is an accepted trade for deployability, and
  it is a candidate for a future record rather than a silent parameter change.

## Alternatives

- **`argon2` / `@node-rs/argon2`.** Rejected: native build on a serverless
  target, where a build failure is a deploy failure, for a security margin that
  is not the binding constraint at this scale.
- **`bcrypt` / `bcryptjs`.** Rejected: 72-byte input truncation is a silent
  correctness trap, and the JS implementation is deliberately slow in the wrong
  dimension.
- **`node:crypto` PBKDF2.** Rejected: available in the same module, but scrypt is
  memory-hard where PBKDF2 is not, at no additional dependency cost.

## Reversal

Reverse this if any of the following becomes true:

- an audit requires argon2id specifically, or a memory-hardness parameter that
  scrypt at these settings cannot meet;
- the deploy target stops being serverless, removing the native-build objection
  and making the argon2 margin free;
- a measured brute-force cost against real hashes shows the `N = 16384, r = 8`
  settings are insufficient at the password policy actually enforced.

Any of those is a new ADR that supersedes this one. It is not a reason to change
`N`, `r` or `p` in [lib/auth/scrypt.ts](../../lib/auth/scrypt.ts) quietly: the
stored-hash format exists precisely so that a cost change is visible.
