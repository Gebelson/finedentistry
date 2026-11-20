const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
// Reproduce the developer environment that previously removed a production-only provider.
execFileSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "node_modules/payload/bin.js",
    "generate:importmap",
    "--disable-transpile",
  ],
  { env: { ...process.env, BLOB_READ_WRITE_TOKEN: "" }, stdio: "pipe" },
);
const map = fs.readFileSync("app/(payload)/admin/importMap.js", "utf8");
for (const component of [
  "@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler",
  "/appointment-date#AppointmentDate",
  "/workspace-views#DashboardView",
  "/rich-editor#ArticleEditor",
])
  assert.ok(
    map.includes('"' + component + '"'),
    component + " must remain registered without production credentials",
  );
assert.match(
  require("../package.json").scripts.build,
  /admin:imports/,
  "Every deployment must regenerate its component registry",
);
console.log(
  "PASS local map regeneration retains production upload provider and all custom fields; build includes registry generation.",
);
