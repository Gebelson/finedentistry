import { existsSync } from "node:fs";
// Only private setup commands may initialize a new local schema.
// Existing databases require an explicit migration, never a schema push during login.
export function allowFreshLocalSchema() {
  const database = process.env.DATABASE_URI;
  if (database?.startsWith("file:") && !existsSync(database.slice(5)))
    process.env.CMS_SCHEMA_PUSH = "true";
}
