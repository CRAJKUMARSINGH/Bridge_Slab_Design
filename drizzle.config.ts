// drizzle.config.ts — root Drizzle Kit config.
//
// STATUS: inert. `drizzle-kit` is not installed, so no command reads this file
// yet. It is committed because `lib/db/drizzle.config.ts` already pins the live
// database lane, and a reader looking for "the drizzle config" at the root
// should find the pointer rather than conclude there isn't one.
//
// The live config for the lib/db workspace package is lib/db/drizzle.config.ts.
// This one keeps the schema path and the credential source in one place for
// root-level tooling, and defines nothing that would silently override it.
//
// Install (declared by lib/db/package.json as a devDependency; not installed):
//   pnpm add -D drizzle-kit
export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
};
