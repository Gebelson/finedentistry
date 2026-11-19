import { DefaultTemplate } from "@payloadcms/next/templates";
import type { AdminViewServerProps } from "payload";
import { redirect } from "next/navigation";
import { ClinicCalendar } from "./clinic-calendar";
export function CalendarView(props: AdminViewServerProps) {
  const { req, visibleEntities } = props.initPageResult;
  if (!req.user || !["admin", "reception"].includes(req.user.role))
    redirect("/admin");
  return (
    <DefaultTemplate {...props} req={req} visibleEntities={visibleEntities}>
      <div className="gutter--left gutter--right">
        <ClinicCalendar />
      </div>
    </DefaultTemplate>
  );
}
