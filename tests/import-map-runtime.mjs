import assert from "node:assert/strict";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), true);
const { default: promise } = await import("../payload.config.ts");
const config = await promise;
assert.equal(
  config.admin.importMap.generators,
  undefined,
  "CLI generators must not cross the RSC client boundary",
);
assert.doesNotThrow(() =>
  JSON.stringify(config.admin.importMap, (_key, value) => {
    if (typeof value === "function")
      throw Error("Runtime component registry contains a function");
    return value;
  }),
);
console.log(
  "PASS runtime import-map settings are serializable and omit CLI-only functions.",
);
