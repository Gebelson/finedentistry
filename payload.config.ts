import path from "node:path";
import { buildConfig, APIError } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { Users } from "./cms/users";
import { Posts, Media, HomePage } from "./cms/editorial";
import { Conversations, Messages, ChatSettings } from "./cms/conversations";
import { chatGet, chatPost } from "./cms/chat-endpoint";
import { Contacts, Appointments } from "./cms/appointments";
import { workspaceReportsHandler } from "./cms/reports-endpoint";
import { appointmentRequestHandler } from "./cms/appointment-request";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";

const secret = process.env.PAYLOAD_SECRET;
const database = process.env.DATABASE_URI;
if (!secret || secret.length < 32 || !database) {
  throw new Error(
    "Clinic admin requires PAYLOAD_SECRET (32+ characters) and DATABASE_URI. Run npm run admin:setup locally.",
  );
}
if (process.env.VERCEL && !database.startsWith("postgres")) {
  throw new Error(
    "Clinic admin on Vercel requires persistent PostgreSQL storage.",
  );
}
if (
  process.env.VERCEL &&
  !process.env.ADMIN_SERVER_URL?.startsWith("https://")
) {
  throw new Error(
    "Set ADMIN_SERVER_URL to the HTTPS origin used by the clinic workspace.",
  );
}

export default buildConfig({
  secret,
  telemetry: false,
  plugins: process.env.BLOB_READ_WRITE_TOKEN
    ? [
        vercelBlobStorage({
          token: process.env.BLOB_READ_WRITE_TOKEN,
          access: "public",
          addRandomSuffix: true,
          clientUploads: true,
          collections: {
            media: {
              prefix: "fine-dentistry",
              generateFileURL: ({ filename }) =>
                "/api/media/file/" + encodeURIComponent(filename),
            },
          },
        }),
      ]
    : [],
  upload: { limits: { fileSize: 12 * 1024 * 1024 } },
  csrf: process.env.ADMIN_SERVER_URL
    ? [
        new URL(process.env.ADMIN_SERVER_URL).origin,
        ...(process.env.VERCEL_URL
          ? ["https://" + process.env.VERCEL_URL]
          : []),
      ]
    : [
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3010",
        "http://localhost:3010",
      ],
  email: () => ({
    name: "disabled-until-configured",
    defaultFromAddress: "no-reply@example.invalid",
    defaultFromName: "Fine Dentistry",
    sendEmail: async () => {
      throw new Error("Workspace email delivery is not configured.");
    },
  }),
  routes: { admin: "/admin", api: "/api" },
  admin: {
    theme: "light",
    user: "users",
    timezones: { defaultTimezone: "America/New_York" },
    meta: {
      titleSuffix: "— Fine Dentistry · Praxis",
      robots: "noindex, nofollow",
    },
    importMap: {
      baseDir: path.resolve(process.cwd(), "components/admin"),
      // Payload forwards these settings to the client. Keep generator functions
      // in the CLI process so runtime RSC configuration stays serializable.
      ...(process.argv.includes("generate:importmap")
        ? {
            generators: [
              ({ addToImportMap }) => {
                // This provider is conditional on a production-only credential. Keep its
                // registration stable when developers regenerate the map without Blob.
                addToImportMap(
                  "@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler",
                );
              },
            ],
          }
        : {}),
    },
    components: {
      Nav: "/navigation#WorkspaceNav",
      views: {
        dashboard: { Component: "/workspace-views#DashboardView" },
        analytics: {
          Component: "/analytics-view#AnalyticsView",
          path: "/analytics",
        },
        reports: {
          Component: "/workspace-views#ReportsView",
          path: "/reports",
        },
        integrations: {
          Component: "/workspace-views#IntegrationsView",
          path: "/integrations",
        },
        calendar: {
          Component: "/calendar-view#CalendarView",
          path: "/calendar",
        },
      },
      graphics: {
        Logo: "/brand#AdminBrand",
        Icon: "/brand#AdminIcon",
      },
      beforeLogin: ["/brand#LoginIntroduction"],
    },
  },
  collections: [
    Users,
    Posts,
    Media,
    Conversations,
    Messages,
    Contacts,
    Appointments,
  ],
  globals: [HomePage, ChatSettings],
  db: database.startsWith("postgres")
    ? postgresAdapter({
        pool: { connectionString: database },
        push: process.env.CMS_SCHEMA_PUSH === "true",
      })
    : sqliteAdapter({
        client: { url: database },
        transactionOptions: { behavior: "immediate" },
        push: process.env.CMS_SCHEMA_PUSH === "true",
      }),
  graphQL: { disable: true },
  endpoints: [
    {
      path: "/appointment-request",
      method: "post",
      handler: appointmentRequestHandler,
    },
    {
      path: "/workspace-reports",
      method: "get",
      handler: workspaceReportsHandler,
    },
    { path: "/clinic-chat", method: "get", handler: chatGet },
    { path: "/clinic-chat", method: "post", handler: chatPost },
    {
      path: "/health",
      method: "get",
      handler: async (req) => {
        if (!req.user) throw new APIError("Authentication required.", 401);
        return Response.json({ authenticated: true });
      },
    },
  ],
  typescript: {
    outputFile: path.resolve(process.cwd(), "cms/payload-types.ts"),
  },
});
