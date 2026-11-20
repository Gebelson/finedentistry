import type { SVGProps } from "react";
export type WorkspaceIconName =
  | "dashboard"
  | "analytics"
  | "reports"
  | "inbox"
  | "calendar"
  | "contacts"
  | "appointments"
  | "assistant"
  | "website"
  | "articles"
  | "media"
  | "team"
  | "connections"
  | "account"
  | "logout"
  | "external"
  | "close";
const paths: Record<WorkspaceIconName, string[]> = {
  dashboard: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"],
  analytics: ["M4 3v17h17", "M8 15v-4", "M13 15V7", "M18 15V4"],
  reports: ["M6 3h9l4 4v14H6z", "M14 3v5h5", "M9 12h7", "M9 16h7"],
  inbox: ["M4 4h16v16H4z", "M4 13h5l2 3h2l2-3h5"],
  calendar: [
    "M4 5h16v16H4z",
    "M4 10h16",
    "M8 3v4",
    "M16 3v4",
    "M8 14h2",
    "M14 14h2",
    "M8 18h2",
  ],
  contacts: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    "M17 4a4 4 0 0 1 0 7",
    "M22 21v-2a4 4 0 0 0-3-3.87",
  ],
  appointments: [
    "M8 3H4v18h16V3h-4",
    "M8 2h8v4H8z",
    "M8 12l2 2 5-5",
    "M8 18h8",
  ],
  assistant: [
    "M5 7h14v12H5z",
    "M12 3v4",
    "M9 11h.01",
    "M15 11h.01",
    "M9 15h6",
    "M2 11v4",
    "M22 11v4",
  ],
  website: [
    "M3 4h18v16H3z",
    "M3 9h18",
    "M7 6.5h.01",
    "M10 6.5h.01",
    "M7 13h10",
    "M7 16h6",
  ],
  articles: ["M5 3h14v18H5z", "M8 7h8", "M8 11h8", "M8 15h8", "M8 18h5"],
  media: ["M3 3h18v18H3z", "M3 16l5-5 5 5 3-3 5 5", "M15 7h.01"],
  team: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    "M17 5h5",
    "M19.5 2.5v5",
  ],
  connections: ["M8 3v4", "M16 3v4", "M6 7h12v5a6 6 0 0 1-12 0z", "M12 18v4"],
  account: ["M20 21a8 8 0 0 0-16 0", "M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10"],
  logout: ["M9 3H4v18h5", "M9 12h12", "M17 8l4 4-4 4"],
  external: ["M14 3h7v7", "M21 3l-11 11", "M10 3H3v18h18v-7"],
  close: ["M6 6l12 12", "M18 6 6 18"],
};
export function WorkspaceIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: WorkspaceIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name].map((d, i) => (
        <path d={d} key={i} />
      ))}
    </svg>
  );
}
