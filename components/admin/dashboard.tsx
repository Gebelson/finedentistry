import type { CollectionSlug, ServerProps, Where } from "payload";
import Link from "next/link";
import { siteAnalyticsSummary } from "@/lib/analytics-store";
import { WebsiteAnalytics } from "./website-analytics";

const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
const doctors: Record<string, string> = {
  trivedi: "Dr. Trivedi",
  lascurain: "Dr. Lascurain",
  perez: "Dr. Perez",
};

export async function ClinicDashboard({ payload, user }: ServerProps) {
  if (!user) return null;
  const canEdit = ["admin", "editor"].includes(user.role);
  const canReceive = ["admin", "reception"].includes(user.role);
  const access = { overrideAccess: false, user };
  const count = (collection: CollectionSlug, where?: Where) =>
    payload.count({ collection, where, ...access });
  const [
    analytics,
    published,
    drafts,
    media,
    contacts,
    waiting,
    open,
    requested,
    queue,
    appointments,
    recent,
    chat,
  ] = await Promise.all([
    user.role === "admin" ? siteAnalyticsSummary(30) : null,
    canEdit ? count("posts", { _status: { equals: "published" } }) : null,
    canEdit ? count("posts", { _status: { equals: "draft" } }) : null,
    canEdit ? count("media") : null,
    canReceive ? count("contacts") : null,
    canReceive
      ? count("conversations", { status: { equals: "waiting" } })
      : null,
    canReceive ? count("conversations", { status: { equals: "open" } }) : null,
    canReceive
      ? count("appointments", { status: { equals: "requested" } })
      : null,
    canReceive
      ? payload.find({
          collection: "conversations",
          where: { status: { not_equals: "resolved" } },
          sort: "-updatedAt",
          limit: 5,
          depth: 0,
          ...access,
        })
      : null,
    canReceive
      ? payload.find({
          collection: "appointments",
          where: {
            and: [
              { status: { equals: "scheduled" } },
              { startsAt: { greater_than_equal: new Date().toISOString() } },
            ],
          },
          sort: "startsAt",
          limit: 5,
          depth: 0,
          ...access,
        })
      : null,
    canEdit
      ? payload.find({
          collection: "posts",
          sort: "-updatedAt",
          limit: 5,
          depth: 0,
          ...access,
        })
      : null,
    canReceive
      ? payload.findGlobal({ slug: "chat-settings", ...access })
      : null,
  ]);
  const metrics =
    user.role === "editor"
      ? [
          {
            label: "Published articles",
            value: published?.totalDocs || 0,
            key: "published-articles",
            href: "/admin/collections/posts",
            color: "blue",
          },
          {
            label: "Draft articles",
            value: drafts?.totalDocs || 0,
            key: "drafts",
            href: "/admin/collections/posts",
            color: "amber",
          },
          {
            label: "Media assets",
            value: media?.totalDocs || 0,
            key: "media",
            href: "/admin/collections/media",
            color: "green",
          },
          {
            label: "Total articles",
            value: (published?.totalDocs || 0) + (drafts?.totalDocs || 0),
            key: "articles",
            href: "/admin/collections/posts",
            color: "purple",
          },
        ]
      : [
          {
            label: "Waiting for reception",
            value: waiting?.totalDocs || 0,
            key: "waiting",
            href: "/admin/collections/conversations",
            color: "amber",
          },
          {
            label: "Appointment requests",
            value: requested?.totalDocs || 0,
            key: "requests",
            href: "/admin/collections/appointments",
            color: "blue",
          },
          {
            label:
              user.role === "admin"
                ? "Published articles"
                : "Open conversations",
            value:
              user.role === "admin"
                ? published?.totalDocs || 0
                : open?.totalDocs || 0,
            key: user.role === "admin" ? "published-articles" : "open",
            href:
              user.role === "admin"
                ? "/admin/collections/posts"
                : "/admin/collections/conversations",
            color: "green",
          },
          {
            label: "Reception contacts",
            value: contacts?.totalDocs || 0,
            key: "contacts",
            href: "/admin/collections/contacts",
            color: "purple",
          },
        ];
  return (
    <section className="clinic-dashboard ops-dashboard">
      <header className="ops-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome, {user.name}. Website performance and practice operations.
          </p>
        </div>
        <Link href="/" className="ops-button ops-button-secondary">
          View website
        </Link>
      </header>
      <nav aria-label="Quick actions" className="ops-quick-actions">
        {canReceive && (
          <>
            <Link
              className="ops-button"
              href="/admin/collections/appointments/create"
            >
              New appointment
            </Link>
            <Link
              className="ops-button ops-button-secondary"
              href="/admin/collections/conversations"
            >
              Reception inbox{" "}
              {waiting?.totalDocs ? (
                <span className="ops-count">{waiting.totalDocs}</span>
              ) : null}
            </Link>
            <Link
              className="ops-button ops-button-secondary"
              href="/admin/collections/contacts/create"
            >
              Add contact
            </Link>
          </>
        )}
        {canEdit && (
          <>
            <Link
              className="ops-button ops-button-secondary"
              href="/admin/collections/posts/create"
            >
              New article
            </Link>
            <Link
              className="ops-button ops-button-secondary"
              href="/admin/globals/home-page"
            >
              Edit website
            </Link>
          </>
        )}
      </nav>
      <div className="ops-kpis">
        {metrics.map((metric) => (
          <Link
            key={metric.key}
            href={metric.href}
            className={`ops-kpi ops-kpi-${metric.color}`}
          >
            <span>{metric.label}</span>
            <strong data-metric={metric.key}>
              {metric.value.toLocaleString("en-US")}
            </strong>
            <small>
              View records <span aria-hidden="true">→</span>
            </small>
          </Link>
        ))}
      </div>
      {analytics && (
        <section
          aria-labelledby="dashboard-analytics-title"
          className="ops-analytics-section"
        >
          <div className="ops-section-heading">
            <h2 id="dashboard-analytics-title">Website analytics</h2>
            <Link href="/admin/analytics">Detailed report</Link>
          </div>
          <WebsiteAnalytics initial={analytics} overview />
        </section>
      )}
      <div className="ops-work-grid">
        {canReceive && (
          <>
            <section className="ops-panel">
              <div className="ops-panel-heading">
                <h2>Reception queue</h2>
                <Link href="/admin/collections/conversations">View all</Link>
              </div>
              <div className="ops-panel-summary">
                <strong>{waiting?.totalDocs || 0}</strong> waiting{" "}
                <span> / </span>
                <strong>{open?.totalDocs || 0}</strong> open
              </div>
              {queue?.docs.length ? (
                <div className="ops-table-scroll">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Conversation</th>
                        <th>Status</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queue.docs.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <Link
                              href={`/admin/collections/conversations/${item.id}`}
                            >
                              {item.reference}
                            </Link>
                          </td>
                          <td>
                            <span
                              className={`ops-status ops-status-${item.status}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td>{date(item.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ops-empty">
                  <strong>No conversations in the queue</strong>
                  <p>
                    Website chats will appear here when visitors send a message.
                  </p>
                </div>
              )}
              <div className="ops-panel-footer">
                <span
                  className={`ops-status ${chat?.enabled ? "ops-status-active" : ""}`}
                >
                  {chat?.enabled ? "Chat enabled" : "Chat disabled"}
                </span>
                <Link href="/admin/globals/chat-settings">Chat settings</Link>
              </div>
            </section>
            <section className="ops-panel">
              <div className="ops-panel-heading">
                <h2>Upcoming appointments</h2>
                <Link href="/admin/calendar">Calendar</Link>
              </div>
              <p className="ops-panel-description">
                Internal planning · Orlando time
              </p>
              {appointments?.docs.length ? (
                <div className="ops-table-scroll">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Contact</th>
                        <th>Date & time</th>
                        <th>Doctor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.docs.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <Link
                              href={`/admin/collections/appointments/${item.id}`}
                            >
                              {item.contactName}
                            </Link>
                          </td>
                          <td>
                            {item.startsAt
                              ? date(item.startsAt)
                              : "Unscheduled"}
                          </td>
                          <td>{doctors[item.doctor || ""] || "Unassigned"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ops-empty">
                  <strong>No upcoming appointments</strong>
                  <p>Add an internal appointment or review pending requests.</p>
                </div>
              )}
              <div className="ops-panel-footer">
                <span>{requested?.totalDocs || 0} pending requests</span>
                <Link href="/admin/collections/appointments">
                  Manage appointments
                </Link>
              </div>
            </section>
          </>
        )}
        {canEdit && (
          <section className="ops-panel">
            <div className="ops-panel-heading">
              <h2>Recent articles</h2>
              <Link href="/admin/collections/posts">All articles</Link>
            </div>
            <div className="ops-table-scroll">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recent?.docs.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/admin/collections/posts/${item.id}`}>
                          {item.title}
                        </Link>
                      </td>
                      <td>
                        <span
                          className={`ops-status ops-status-${item._status}`}
                        >
                          {item._status}
                        </span>
                      </td>
                      <td>{date(item.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ops-panel-footer">
              <span>
                {drafts?.totalDocs || 0} drafts · {media?.totalDocs || 0} media
                assets
              </span>
              <Link href="/admin/collections/media">Media library</Link>
            </div>
          </section>
        )}
        {user.role === "admin" && (
          <section className="ops-panel">
            <div className="ops-panel-heading">
              <h2>Connections</h2>
              <Link href="/admin/integrations">Manage</Link>
            </div>
            <ul className="ops-connections">
              <li>
                <span>Website & blog</span>
                <span className="ops-status ops-status-active">Connected</span>
              </li>
              <li>
                <span>Website analytics</span>
                <span className="ops-status ops-status-active">Collecting</span>
              </li>
              <li>
                <span>Website chat</span>
                <span
                  className={`ops-status ${chat?.enabled ? "ops-status-active" : ""}`}
                >
                  {chat?.enabled ? "Enabled" : "Disabled"}
                </span>
              </li>
              <li>
                <span>Practice-management calendar</span>
                <span className="ops-status">Not connected</span>
              </li>
              <li>
                <span>Payments, SMS & email</span>
                <span className="ops-status">Not connected</span>
              </li>
            </ul>
            <p className="ops-panel-description ops-panel-note">
              The calendar is internal planning. The assistant answers from the
              practice FAQ.
            </p>
            <div className="ops-panel-footer">
              <Link href="/admin/collections/users">Team members</Link>
              <Link href="/admin/reports">Workspace reports</Link>
            </div>
          </section>
        )}
      </div>
      <footer className="ops-footer">
        Fine Dentistry Workspace <span>Powered by Praxis</span>
      </footer>
    </section>
  );
}
