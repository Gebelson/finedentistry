import type { ServerProps } from "payload";
import Link from "next/link";
import { siteAnalyticsSummary } from "@/lib/analytics-store";

export async function ClinicDashboard({ payload, user }: ServerProps) {
  if (!user) return null;
  const canEdit = ["admin", "editor"].includes(user.role);
  const analytics =
    user.role === "admin" ? await siteAnalyticsSummary(7) : null;
  const articles = canEdit
    ? await payload.count({ collection: "posts", overrideAccess: false, user })
    : null;
  const canReceive = ["admin", "reception"].includes(user.role);
  const waiting = canReceive
    ? await payload.count({
        collection: "conversations",
        where: { status: { equals: "waiting" } },
        overrideAccess: false,
        user,
      })
    : null;
  const team =
    user.role === "admin"
      ? await payload.count({
          collection: "users",
          overrideAccess: false,
          user,
        })
      : null;
  return (
    <section className="clinic-dashboard">
      <div className="clinic-dashboard-top">
        <span>FINE DENTISTRY / WORKSPACE</span>
        <Link href="/">View website ↗</Link>
      </div>
      <h1>
        Your practice,
        <br />
        <em>in focus.</em>
      </h1>
      <p className="clinic-dashboard-lead">
        Welcome, {user.name}. Manage your website and reception workspace.
      </p>
      <div className="clinic-workspace-grid">
        {analytics && (
          <article>
            <span className="clinic-module-number">WEBSITE / LAST 7 DAYS</span>
            <h2>{analytics.views.toLocaleString("en-US")} page views.</h2>
            <p>
              {analytics.visitorDays.toLocaleString("en-US")} estimated
              visitor-days · {analytics.active} active now. Real traffic,
              referrals and contact interactions from your website.
            </p>
            <Link href="/admin/analytics">Explore website analytics ↗</Link>
          </article>
        )}
        <article>
          <span className="clinic-module-number">01 / ACCESS</span>
          <h2>Your team. Your permissions.</h2>
          <p>
            {team
              ? `${team.totalDocs} team ${team.totalDocs === 1 ? "member has" : "members have"} workspace access.`
              : "Your account is active. An administrator manages team permissions."}
          </p>
          <a
            href={
              user.role === "admin"
                ? "/admin/collections/users"
                : "/admin/account"
            }
          >
            {user.role === "admin"
              ? "Manage team members"
              : "View your account"}{" "}
            ↗
          </a>
        </article>
        <article>
          <span className="clinic-module-number">02 / WEBSITE</span>
          <h2>Dev Mode.</h2>
          <p>
            Edit homepage sections and images. Save a draft, preview on desktop
            or mobile, then publish.
          </p>
          {canEdit && (
            <Link href="/admin/globals/home-page">Edit the homepage ↗</Link>
          )}
          {!canEdit && (
            <span className="clinic-status">
              Content editor access required
            </span>
          )}
        </article>
        {canEdit && (
          <>
            <article>
              <span className="clinic-module-number">03 / JOURNAL</span>
              <h2>The patient journal.</h2>
              <p>
                {articles?.totalDocs || 0} articles. Edit text, links, tables,
                authors and search metadata, with draft and publication history.
              </p>
              <Link href="/admin/collections/posts">Manage articles ↗</Link>
            </article>
            <article>
              <span className="clinic-module-number">04 / MEDIA</span>
              <h2>Your image library.</h2>
              <p>
                Upload website images and add accessible descriptions. Use them
                in homepage sections and articles.
              </p>
              <Link href="/admin/collections/media">Open media library ↗</Link>
            </article>
          </>
        )}
        {canReceive && (
          <>
            <article>
              <span className="clinic-module-number">05 / RECEPTION</span>
              <h2>Your conversation inbox.</h2>
              <p>
                {waiting?.totalDocs || 0} conversations waiting. Read website
                messages, take over from the FAQ assistant and reply to
                visitors.
              </p>
              <Link href="/admin/collections/conversations">
                Open conversations ↗
              </Link>
            </article>
            <article>
              <span className="clinic-module-number">06 / CHAT SETTINGS</span>
              <h2>Your choice of support.</h2>
              <p>
                Choose reception, the built-in FAQ assistant, or both with human
                handoff. Enable website chat when your team is ready.
              </p>
              <Link href="/admin/globals/chat-settings">
                Configure website chat ↗
              </Link>
            </article>
            <article>
              <span className="clinic-module-number">07 / CALENDAR</span>
              <h2>A clearer view of your day.</h2>
              <p>
                Organize requests and internal appointment times by doctor.
                Review the month in Orlando time.
              </p>
              <Link href="/admin/calendar">Open calendar ↗</Link>
            </article>
            <article>
              <span className="clinic-module-number">08 / CONTACTS</span>
              <h2>Keep the conversation going.</h2>
              <p>
                Manage reception contact details, preferred contact methods and
                lead sources.
              </p>
              <Link href="/admin/collections/contacts">Manage contacts ↗</Link>
            </article>
          </>
        )}
      </div>
      <div className="clinic-integration-status">
        <h2>A foundation to build on.</h2>
        <p>
          Website chat uses this workspace. The FAQ assistant answers from the
          practice’s existing information. Generative AI, SMS, email,
          practice-management scheduling and marketing providers are not
          connected.
        </p>
        {user.role === "admin" && (
          <p>
            <Link href="/admin/reports">Workspace reports ↗</Link> ·{" "}
            <Link href="/admin/integrations">Integration status ↗</Link>
          </p>
        )}
      </div>
      <div className="clinic-dashboard-signature">
        Designed for Fine Dentistry. <strong>Built by Praxis.</strong>
      </div>
    </section>
  );
}
