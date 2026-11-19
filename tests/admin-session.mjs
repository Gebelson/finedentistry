import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), true);
const { getPayload } = await import("payload");
const { default: config } = await import("../payload.config.ts");
const payload = await getPayload({ config });
const before = await payload.count({ collection: "users" });
if (before.totalDocs) {
  await payload.destroy();
  throw new Error(
    "Session test requires a fresh local database; it will not modify existing accounts.",
  );
}
const password = randomBytes(24).toString("base64url");
const email = "workspace-test@example.invalid";
const setup = spawnSync(
  process.execPath,
  ["--import", "tsx", "scripts/admin-create.ts"],
  {
    env: {
      ...process.env,
      ADMIN_SETUP_NAME: "Workspace test",
      ADMIN_SETUP_EMAIL: email,
      ADMIN_SETUP_PASSWORD: password,
    },
    stdio: "inherit",
  },
);
if (setup.status !== 0) {
  await payload.destroy();
  throw new Error("Private administrator setup failed.");
}
const admin = (
  await payload.find({
    collection: "users",
    where: { email: { equals: email } },
  })
).docs[0];
try {
  const result = spawnSync(process.execPath, ["tests/admin-access.cjs"], {
    env: {
      ...process.env,
      TEST_ADMIN_EMAIL: email,
      TEST_ADMIN_PASSWORD: password,
    },
    stdio: "inherit",
  });
  if (result.status !== 0) process.exitCode = 1;
} finally {
  await payload.delete({
    collection: "users",
    where: {
      email: {
        in: [
          email,
          "editor-test@example.invalid",
          "cross-site@example.invalid",
          "escalation@example.invalid",
        ],
      },
    },
  });
  await payload.destroy();
}
