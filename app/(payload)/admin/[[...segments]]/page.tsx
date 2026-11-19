import config from "@payload-config";
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import { importMap } from "../importMap";
import { getPayload } from "payload";
import Link from "next/link";

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};
export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams });

export default async function AdminPage({ params, searchParams }: Args) {
  const { segments } = await params;
  if (segments?.[0] === "forgot")
    return (
      <main className="clinic-login-intro" style={{ padding: "15vh 24px" }}>
        <h1>Need help signing in?</h1>
        <p>
          Contact your workspace administrator to restore account access.
          <br />
          Email password recovery is not available yet.
        </p>
        <Link href="/admin/login">← Back to login</Link>
      </main>
    );
  const payload = await getPayload({ config });
  const accounts = await payload.count({ collection: "users" });
  if (!accounts.totalDocs)
    return (
      <main className="clinic-login-intro" style={{ padding: "15vh 24px" }}>
        <h1>Your workspace is being prepared.</h1>
        <p>
          An administrator must complete the private account setup before
          sign-in is available.
        </p>
        <Link href="/">← Back to the website</Link>
      </main>
    );
  return RootPage({ config, params, searchParams, importMap });
}
