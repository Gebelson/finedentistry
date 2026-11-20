import { DefaultTemplate } from "@payloadcms/next/templates";
import type { AdminViewServerProps } from "payload";
import { redirect } from "next/navigation";
import { ClinicDashboard } from "./dashboard";
import { WorkspaceReports } from "./workspace-reports";
import { WorkspaceConnections } from "./workspace-connections";

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
  return (
    <DefaultTemplate {...props} req={req} visibleEntities={visibleEntities}>
      <WorkspaceConnections />
    </DefaultTemplate>
  );
}
