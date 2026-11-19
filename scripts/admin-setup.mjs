import { randomBytes } from "node:crypto";
import { mkdirSync, existsSync, appendFileSync } from "node:fs";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true);
mkdirSync(".data", { recursive: true });
const additions = [];
if (!process.env.PAYLOAD_SECRET)
  additions.push(`PAYLOAD_SECRET=${randomBytes(48).toString("hex")}`);
if (!process.env.DATABASE_URI)
  additions.push("DATABASE_URI=file:.data/clinic.db");
if (additions.length)
  appendFileSync(
    ".env.local",
    `\n# Local clinic administration (never commit)\n${additions.join("\n")}\n`,
  );
console.log(
  "Local admin environment is ready. Run npm run admin:create to create the first administrator.",
);
if (!existsSync(".data")) process.exitCode = 1;
