import { DefaultTemplate } from "@payloadcms/next/templates";
import type { AdminViewServerProps } from "payload";
import { redirect } from "next/navigation";
import { siteAnalyticsSummary } from "@/lib/analytics-store";
import { WebsiteAnalytics } from "./website-analytics";

export async function AnalyticsView(props: AdminViewServerProps) {
  const { req, visibleEntities } = props.initPageResult;
  if (req.user?.role !== "admin") redirect("/admin");
  return (
    <DefaultTemplate {...props} req={req} visibleEntities={visibleEntities}>
      <section className="gutter--left gutter--right clinic-reports">
        <p className="clinic-report-kicker">WEBSITE / ANALYTICS</p>
        <h1>Website analytics</h1>
        <p>
          Real activity from your website. Collected from activation, with no
          historical estimates added.
        </p>
        <WebsiteAnalytics initial={await siteAnalyticsSummary()} />
      </section>
    </DefaultTemplate>
  );
}
