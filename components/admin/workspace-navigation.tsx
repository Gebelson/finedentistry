"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNav } from "@payloadcms/ui";
import { WorkspaceIcon, type WorkspaceIconName } from "./workspace-icon";
type Destination = { label: string; href: string; icon: WorkspaceIconName };
export function WorkspaceNavigation({
  name,
  role,
}: {
  name: string;
  role: "admin" | "editor" | "reception";
}) {
  const path = usePathname();
  const { navOpen, setNavOpen, navRef, hydrated, shouldAnimate } = useNav();
  const admin = role === "admin",
    content = admin || role === "editor",
    reception = admin || role === "reception";
  const groups: { label: string; links: Destination[] }[] = [
    {
      label: "Overview",
      links: [
        { label: "Dashboard", href: "/admin", icon: "dashboard" },
        ...(admin
          ? [
              {
                label: "Analytics",
                href: "/admin/analytics",
                icon: "analytics" as const,
              },
              {
                label: "Reports",
                href: "/admin/reports",
                icon: "reports" as const,
              },
            ]
          : []),
      ],
    },
    ...(reception
      ? [
          {
            label: "Reception",
            links: [
              {
                label: "Inbox",
                href: "/admin/collections/conversations",
                icon: "inbox" as const,
              },
              {
                label: "Calendar",
                href: "/admin/calendar",
                icon: "calendar" as const,
              },
              {
                label: "Appointments",
                href: "/admin/collections/appointments",
                icon: "appointments" as const,
              },
              {
                label: "Contacts",
                href: "/admin/collections/contacts",
                icon: "contacts" as const,
              },
              {
                label: "Chat & assistant",
                href: "/admin/globals/chat-settings",
                icon: "assistant" as const,
              },
            ],
          },
        ]
      : []),
    ...(content
      ? [
          {
            label: "Website",
            links: [
              {
                label: "Page editor",
                href: "/admin/globals/home-page",
                icon: "website" as const,
              },
              {
                label: "Blog articles",
                href: "/admin/collections/posts",
                icon: "articles" as const,
              },
              {
                label: "Media library",
                href: "/admin/collections/media",
                icon: "media" as const,
              },
            ],
          },
        ]
      : []),
    ...(admin
      ? [
          {
            label: "Administration",
            links: [
              {
                label: "Team members",
                href: "/admin/collections/users",
                icon: "team" as const,
              },
              {
                label: "Connections",
                href: "/admin/integrations",
                icon: "connections" as const,
              },
            ],
          },
        ]
      : []),
  ];
  const navigate = () => {
    if (window.matchMedia("(max-width:1024px)").matches) setNavOpen(false);
  };
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <aside
      className={[
        "nav",
        "workspace-nav",
        navOpen && "nav--nav-open",
        hydrated && "nav--nav-hydrated",
        shouldAnimate && "nav--nav-animate",
      ]
        .filter(Boolean)
        .join(" ")}
      inert={!navOpen ? true : undefined}
    >
      <div className="nav__scroll workspace-nav-shell" ref={navRef}>
        <div className="workspace-nav-brand">
          <Link
            href="/admin"
            onClick={navigate}
            aria-label="Fine Dentistry dashboard"
          >
            <img
              src="/images/bannerlogo.webp"
              width="160"
              height="60"
              alt="Fine Dentistry of Downtown Orlando"
            />
          </Link>
          <span>Practice workspace</span>
          <button
            type="button"
            className="workspace-nav-collapse"
            aria-label="Collapse navigation"
            title="Collapse navigation"
            onClick={() => setNavOpen(false)}
          >
            <WorkspaceIcon name="collapse" />
          </button>
          <button
            type="button"
            className="nav__mobile-close workspace-nav-close"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            <WorkspaceIcon name="close" />
          </button>
        </div>
        <nav aria-label="Workspace navigation" className="workspace-nav-links">
          {groups.map((group) => (
            <div key={group.label} className="workspace-nav-group">
              <p className="workspace-nav-group-title">{group.label}</p>
              {group.links.map((link) => {
                const current =
                  link.href === "/admin"
                    ? path === "/admin"
                    : path === link.href || path.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    onClick={navigate}
                    aria-current={current ? "page" : undefined}
                    className="workspace-nav-link"
                  >
                    <WorkspaceIcon name={link.icon} />
                    <span>{link.label}</span>
                    {current && <span className="workspace-active-mark" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <footer className="workspace-nav-footer">
          <Link className="workspace-nav-site" href="/" onClick={navigate}>
            <WorkspaceIcon name="external" />
            <span>View website</span>
          </Link>
          <div className="workspace-nav-account">
            <Link
              href="/admin/account"
              onClick={navigate}
              aria-label="Your account"
              className="workspace-account-link"
            >
              <span className="workspace-user-avatar">{initials}</span>
              <span>
                <strong>{name}</strong>
                <small>
                  {admin
                    ? "Administrator"
                    : role === "editor"
                      ? "Content editor"
                      : "Reception"}
                </small>
              </span>
            </Link>
            <Link
              href="/admin/logout"
              prefetch={false}
              aria-label="Sign out"
              className="workspace-signout"
            >
              <WorkspaceIcon name="logout" />
            </Link>
          </div>
          <span className="workspace-praxis">
            Workspace by <strong>Praxis</strong>
          </span>
        </footer>
      </div>
    </aside>
  );
}
