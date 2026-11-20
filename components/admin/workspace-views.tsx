import { DefaultTemplate } from "@payloadcms/next/templates";
import type { AdminViewServerProps } from "payload";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClinicDashboard } from "./dashboard";

export function DashboardView(props: AdminViewServerProps) {
  const { req } = props.initPageResult;
  if (!req.user) redirect("/admin/login");
  // Payload already supplies DefaultTemplate for the dashboard route.
  return (
    <div className="gutter--left gutter--right">
      <ClinicDashboard {...props} payload={req.payload} user={req.user} />
    </div>
  );
}

export async function ReportsView(props: AdminViewServerProps) {
  const { req, visibleEntities } = props.initPageResult;
  if (req.user?.role !== "admin") redirect("/admin");
  const payload = req.payload;
  const [
    articles,
    published,
    contacts,
    conversations,
    waiting,
    resolved,
    appointments,
    requested,
  ] = await Promise.all([
    payload.count({ collection: "posts" }),
    payload.count({
      collection: "posts",
      where: { _status: { equals: "published" } },
    }),
    payload.count({ collection: "contacts" }),
    payload.count({ collection: "conversations" }),
    payload.count({
      collection: "conversations",
      where: { status: { equals: "waiting" } },
    }),
    payload.count({
      collection: "conversations",
      where: { status: { equals: "resolved" } },
    }),
    payload.count({ collection: "appointments" }),
    payload.count({
      collection: "appointments",
      where: { status: { equals: "requested" } },
    }),
  ]);
  const metrics: [string, number][] = [
    ["Published articles", published.totalDocs],
    ["Articles in the workspace", articles.totalDocs],
    ["Reception contacts", contacts.totalDocs],
    ["Website conversations", conversations.totalDocs],
    ["Waiting for reception", waiting.totalDocs],
    ["Resolved conversations", resolved.totalDocs],
    ["Internal appointment records", appointments.totalDocs],
    ["Appointment requests", requested.totalDocs],
  ];
  return (
    <DefaultTemplate {...props} req={req} visibleEntities={visibleEntities}>
      <section className="gutter--left gutter--right clinic-reports">
        <p className="clinic-report-kicker">WORKSPACE / REPORTS</p>
        <h1>Workspace reports</h1>
        <p>
          Live totals from this workspace. These figures do not represent the
          clinic’s historical records or external marketing results.
        </p>
        <dl className="clinic-report-grid">
          {metrics.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="clinic-report-note">
          <h2>Explore website performance.</h2>
          <p>
            Website traffic is available in Analytics. Ad spend, search rankings
            and revenue are not connected. Conversation and appointment counts
            are not presented as new patients or financial ROI.
          </p>
          <Link href="/admin/analytics">Open website analytics ↗</Link>
        </div>
      </section>
    </DefaultTemplate>
  );
}

export async function IntegrationsView(props: AdminViewServerProps) {
  const { req, visibleEntities } = props.initPageResult;
  if (req.user?.role !== "admin") redirect("/admin");
  const chat = await req.payload.findGlobal({ slug: "chat-settings" });
  const supplied = (key: string) =>
    process.env[key]
      ? "Credentials supplied · connection unverified"
      : "Not configured";
  const integrations = [
    [
      "Content and blog",
      "Active in this workspace",
      "Drafts, version history, preview and publication.",
    ],
    [
      "Website chat",
      chat.enabled ? "Enabled" : "Disabled in settings",
      "Reception inbox, visitor messages and human handoff.",
    ],
    [
      "Practice assistant",
      "Built-in FAQ engine",
      `Selected mode: ${chat.mode || "reception"}. No generative model is connected.`,
    ],
    [
      "Generative AI",
      supplied("OPENAI_API_KEY"),
      "A model provider and approved clinic knowledge workflow are required.",
    ],
    [
      "Practice-management calendar",
      "Not connected",
      "The current calendar is internal planning. Patient confirmations are not sent.",
    ],
    [
      "Email delivery",
      supplied("RESEND_API_KEY"),
      "Campaign delivery, notifications and email password recovery are not active.",
    ],
    [
      "SMS and telephone",
      supplied("TWILIO_AUTH_TOKEN"),
      "Texting, call tracking and call recording require a messaging/telephony account.",
    ],
    [
      "Payments and memberships",
      supplied("STRIPE_SECRET_KEY"),
      "This workspace does not process payments. The website retains the official clinic payment link.",
    ],
    [
      "Website analytics",
      "First-party tracking active",
      "Page views, daily visitor estimates, referrals and contact clicks. Search Console, rankings and ad reporting are separate integrations.",
    ],
    [
      "Production data",
      process.env.DATABASE_URI?.startsWith("postgres")
        ? "Persistent PostgreSQL configured"
        : "Local SQLite active",
      "Website content and reception records use the configured database. Production uploads use persistent object storage.",
    ],
  ];
  return (
    <DefaultTemplate {...props} req={req} visibleEntities={visibleEntities}>
      <section className="gutter--left gutter--right clinic-reports">
        <p className="clinic-report-kicker">WORKSPACE / CONNECTIONS</p>
        <h1>Connections</h1>
        <p>
          Actual capability and configuration status. Supplying a credential
          alone does not activate an integration.
        </p>
        <div className="clinic-connections">
          {integrations.map(([name, status, detail]) => (
            <article key={name}>
              <div>
                <h2>{name}</h2>
                <span>{status}</span>
              </div>
              <p>{detail}</p>
            </article>
          ))}
        </div>
        <p className="clinic-report-note">
          Search indexing remains disabled for the preview domain.
        </p>
      </section>
    </DefaultTemplate>
  );
}
