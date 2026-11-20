import { DefaultTemplate } from "@payloadcms/next/templates";
import type { AdminViewServerProps } from "payload";
import { redirect } from "next/navigation";
import { ClinicDashboard } from "./dashboard";
import { WorkspaceReports } from "./workspace-reports";

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
  return (
    <DefaultTemplate {...props} req={req} visibleEntities={visibleEntities}>
      <WorkspaceReports />
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
