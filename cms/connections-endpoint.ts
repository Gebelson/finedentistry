import type { PayloadRequest } from "payload";
import { sourceFAQs } from "../lib/content";
import { siteAnalyticsSummary } from "../lib/analytics-store";
import { probePracticeAI } from "./practice-assistant";

export type ConnectionStatus =
  "verified" | "disabled" | "needs_setup" | "needs_verification" | "error";
export type ConnectionCheck = {
  id: string;
  name: string;
  status: ConnectionStatus;
  detail: string;
  next: string;
  href?: string;
  linkLabel?: string;
};
export type ConnectionReport = {
  checkedAt: string;
  connections: ConnectionCheck[];
};
type ProbeResult = { status: string; model: string };
type Options = {
  env?: Record<string, string | undefined>;
  analyticsCheck?: () => Promise<unknown>;
  aiProbe?: (req: PayloadRequest) => Promise<ProbeResult>;
  probeAI?: boolean;
};

export async function createConnectionReport(
  req: PayloadRequest,
  options: Options = {},
): Promise<ConnectionReport> {
  const env = options.env || process.env;
  const count = (
    collection:
      "posts" | "conversations" | "messages" | "media" | "appointments",
  ) => req.payload.count({ collection, overrideAccess: false, req });
  const check = async (
    item: ConnectionCheck,
    operation: () => Promise<Partial<ConnectionCheck>>,
  ): Promise<ConnectionCheck> => {
    try {
      return { ...item, ...(await operation()) };
    } catch {
      return {
        ...item,
        status: "error",
        detail:
          "The live check could not complete. No private error details are exposed.",
        next: "Retry the check. If it continues to fail, review server configuration.",
      };
    }
  };
  const connections = await Promise.all([
    check(
      {
        id: "content",
        name: "Content and blog",
        status: "verified",
        detail:
          "The article database responded successfully. Drafts, history, preview and publication are available.",
        next: "Manage articles and preview changes before publishing.",
        href: "/admin/collections/posts",
        linkLabel: "Open articles",
      },
      async () => {
        await count("posts");
        return {};
      },
    ),
    check(
      {
        id: "chat",
        name: "Website chat",
        status: "verified",
        detail:
          "Chat settings and the reception message database responded successfully.",
        next: "Open the inbox to answer website visitors.",
        href: "/admin/collections/conversations",
        linkLabel: "Open reception inbox",
      },
      async () => {
        const [settings] = await Promise.all([
          req.payload.findGlobal({
            slug: "chat-settings",
            overrideAccess: false,
            req,
          }),
          count("conversations"),
          count("messages"),
        ]);
        return settings.enabled
          ? {}
          : {
              status: "disabled",
              detail: "Website chat is switched off in clinic settings.",
              next: "Enable website chat in Chat & assistant settings.",
              href: "/admin/globals/chat-settings",
              linkLabel: "Open chat settings",
            };
      },
    ),
    check(
      {
        id: "assistant",
        name: "Practice assistant",
        status: "verified",
        detail:
          "The built-in practice FAQ is available. It does not diagnose or confirm appointments.",
        next: "Choose assistant, reception or hybrid mode in chat settings.",
        href: "/admin/globals/chat-settings",
        linkLabel: "Configure assistant",
      },
      async () => {
        if (!sourceFAQs.some((item) => item.q.trim() && item.a.trim()))
          throw Error("FAQ unavailable");
        const settings = await req.payload.findGlobal({
          slug: "chat-settings",
          overrideAccess: false,
          req,
        });
        return !settings.enabled || settings.mode === "reception"
          ? {
              status: "disabled",
              detail:
                "The FAQ engine is available, but the current chat settings do not use the assistant.",
            }
          : {};
      },
    ),
    check(
      {
        id: "ai",
        name: "Generative AI",
        status: "needs_verification",
        detail:
          "Uses Vercel AI Gateway with a live zero-price model check. Only approved public FAQ context is sent; visitor messages and histories are not forwarded.",
        next: "Run the AI connection test to verify authentication, model access and generation.",
      },
      async () => {
        if (env.PRACTICE_AI_ENABLED !== "true")
          return {
            status: "disabled",
            detail:
              "AI generation is not enabled. Website chat continues using the built-in FAQ.",
            next: "Enable PRACTICE_AI_ENABLED on the server after reviewing the model and public knowledge source.",
          };
        if (!options.probeAI) return {};
        const result = await (options.aiProbe || probePracticeAI)(req);
        if (result.status === "ready")
          return {
            status: "verified",
            detail:
              "A real model response was received through Vercel AI Gateway using public practice knowledge. The model passed the current zero-price check.",
            next: "General FAQ answers may use AI; failures automatically retain the built-in FAQ.",
          };
        const reasons: Record<string, string> = {
          disabled: "AI generation is disabled.",
          missing_auth:
            "Vercel OIDC or an AI Gateway credential is unavailable.",
          pricing_unverified:
            "The model could not be verified as zero-price. Generation was not attempted.",
          auth_failed: "The Gateway rejected authentication or project access.",
          account_verification_required:
            "Vercel requires account verification before model access is available.",
          credits_required:
            "The Gateway requires account credits. No credit purchase was made.",
          invalid_response:
            "The provider did not return a usable bounded response.",
          unavailable:
            "The provider could not complete generation within the request limit.",
        };
        return {
          status: "needs_setup",
          detail:
            reasons[result.status] ||
            "The live AI request did not succeed. FAQ answers remain available.",
          next: "Review AI Gateway account access. No paid model fallback or automatic credit purchase is enabled.",
          href: "https://vercel.com/zapi-group/~/ai-gateway",
          linkLabel: "Open AI Gateway",
        };
      },
    ),
    check(
      {
        id: "calendar",
        name: "Practice-management calendar",
        status: "needs_setup",
        detail:
          "The internal appointment database is available; synchronization with the clinic practice-management system is not connected.",
        next: "The clinic must identify its system and authorize its scheduling API. Internal calendar export does not synchronize changes or send confirmations.",
        href: "/admin/calendar",
        linkLabel: "Open internal calendar",
      },
      async () => {
        await count("appointments");
        return {};
      },
    ),
    Promise.resolve({
      id: "email",
      name: "Email delivery",
      status: "needs_setup",
      detail: env.RESEND_API_KEY
        ? "A credential is present, but delivery and sender verification have not been implemented or verified."
        : "Resend installation is blocked by provider terms acceptance. No email credential or verified sender is available.",
      next: "An authorized account owner must accept provider terms, provision the service and verify a clinic-owned sending domain. Email recovery, notifications and campaigns are not active.",
      href: "https://vercel.com/zapi-group/~/integrations/accept-terms/resend?source=cli",
      linkLabel: "Review Resend setup",
    } as ConnectionCheck),
    Promise.resolve({
      id: "sms",
      name: "SMS and telephone",
      status: "needs_setup",
      detail: env.TWILIO_AUTH_TOKEN
        ? "A credential is present; messaging, numbers and call tracking are not implemented or verified."
        : "No messaging account, sending number or telephone integration is connected.",
      next: "The clinic must provide an authorized telephony account and complete number/recipient and messaging registration requirements. No SMS or calls are sent.",
      href: "https://www.twilio.com/console",
      linkLabel: "Open Twilio account",
    } as ConnectionCheck),
    Promise.resolve({
      id: "payments",
      name: "Payments and memberships",
      status: "needs_setup",
      detail: env.STRIPE_SECRET_KEY
        ? "A credential is present, but payment processing has not been implemented or verified."
        : "Stripe installation is blocked by provider terms acceptance. This workspace does not process payments.",
      next: "An authorized clinic representative must complete Stripe onboarding, business verification and payment settings. The existing official website payment link remains available.",
      href: "https://vercel.com/zapi-group/~/integrations/accept-terms/stripe?source=cli",
      linkLabel: "Review Stripe setup",
    } as ConnectionCheck),
    check(
      {
        id: "analytics",
        name: "Website analytics",
        status: "verified",
        detail:
          "The first-party analytics database responded successfully. It records aggregate traffic and contact interactions.",
        next: "Google Analytics, Search Console and advertising reports are separate account connections.",
        href: "/admin/analytics",
        linkLabel: "Open website analytics",
      },
      async () => {
        if (env.ANALYTICS_ENABLED === "false")
          return {
            status: "disabled",
            detail: "Analytics collection is disabled by server configuration.",
            next: "Review the analytics privacy and collection configuration.",
          };
        await (options.analyticsCheck || (() => siteAnalyticsSummary(7)))();
        return {};
      },
    ),
    check(
      {
        id: "data",
        name: "Production data",
        status: "verified",
        detail:
          "The content and media metadata database responded successfully.",
        next: "Uploads use configured object storage. This read check does not perform a new upload or verify every existing file.",
        href: "/admin/collections/media",
        linkLabel: "Open media library",
      },
      async () => {
        await count("media");
        return {
          detail: env.DATABASE_URI?.startsWith("postgres")
            ? `Persistent PostgreSQL responded successfully. ${env.BLOB_READ_WRITE_TOKEN ? "Blob storage is configured; object delivery is not tested by this database check." : "Blob storage is not configured."}`
            : "The local SQLite database responded successfully; production PostgreSQL is not configured in this environment.",
        };
      },
    ),
  ]);
  return { checkedAt: new Date().toISOString(), connections };
}

const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Authorization",
};
export async function connectionChecksHandler(
  req: PayloadRequest,
): Promise<Response> {
  if (req.user?.role !== "admin")
    return Response.json(
      { error: "Administrator access required." },
      { status: req.user ? 403 : 401, headers },
    );
  let probeAI = false;
  if (req.method === "POST") {
    const origin = req.headers.get("origin");
    if (
      !origin ||
      !req.payload.config.csrf.includes(origin) ||
      req.headers.get("sec-fetch-site") === "cross-site"
    )
      return Response.json(
        { error: "Same-origin request required." },
        { status: 403, headers },
      );
    let body: unknown;
    try {
      body = await req.json!();
    } catch {
      return Response.json(
        { error: "Invalid connection test." },
        { status: 400, headers },
      );
    }
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !("action" in body) ||
      body.action !== "ai"
    )
      return Response.json(
        { error: "Choose the AI connection test." },
        { status: 400, headers },
      );
    probeAI = true;
  }
  return Response.json(await createConnectionReport(req, { probeAI }), {
    headers,
  });
}
