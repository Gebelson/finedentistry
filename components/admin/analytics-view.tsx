import { HeadingInfo } from "./info-tip";
import { AnalyticsHelp } from "./analytics-help";
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
        <HeadingInfo title="Website analytics" level={1}>
          <AnalyticsHelp />
        </HeadingInfo>
        <WebsiteAnalytics initial={await siteAnalyticsSummary()} />
      </section>
    </DefaultTemplate>
  );
}
