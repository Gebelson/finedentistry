import nextEnv from "@next/env";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { allowFreshLocalSchema } from "../cms/database-init";

nextEnv.loadEnvConfig(process.cwd(), true);
allowFreshLocalSchema();
let muted = false;
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!muted) process.stdout.write(chunk);
    callback();
  },
});
const input = createInterface({
  input: process.stdin,
  output,
  terminal: !!process.stdin.isTTY,
});
const ask = (question: string) =>
  new Promise<string>((resolve) => input.question(question, resolve));
let instance: import("payload").Payload | undefined;

try {
  const name =
    process.env.ADMIN_SETUP_NAME || (await ask("Administrator name: "));
  const email =
    process.env.ADMIN_SETUP_EMAIL || (await ask("Administrator email: "));
  let password = process.env.ADMIN_SETUP_PASSWORD;
  if (!password) {
    process.stdout.write("Password (at least 14 characters, hidden): ");
    muted = true;
    password = await ask("");
    muted = false;
    process.stdout.write("\n");
  }
  input.close();
  if (
    !name.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 14
  ) {
    throw new Error(
      "Provide a name, valid email and a password of at least 14 characters.",
    );
  }
  const { getPayload } = await import("payload");
  const { default: config } = await import("../payload.config");
  const payload = await getPayload({ config });
  instance = payload;
  const existing = await payload.count({ collection: "users" });
  if (existing.totalDocs)
    throw new Error(
      "An account already exists. Sign in as an administrator to manage team members.",
    );
  await payload.create({
    collection: "users",
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "admin",
    },
    context: { bootstrapAdmin: true },
  });
  console.log(
    "Administrator created. Sign in at /admin/login with your chosen credentials.",
  );
} catch (error) {
  input.close();
  console.error(
    error instanceof Error ? error.message : "Administrator setup failed.",
  );
  process.exitCode = 1;
} finally {
  await instance?.destroy();
}
