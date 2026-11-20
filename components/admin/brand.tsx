import Link from "next/link";
export function AdminBrand() {
  return (
    <div className="clinic-admin-brand">
      <img
        src="/images/bannerlogo.webp"
        width="220"
        height="83"
        alt="Fine Dentistry of Downtown Orlando"
      />
      <span>WORKSPACE BY PRAXIS</span>
    </div>
  );
}
export function AdminIcon() {
  return (
    <span className="clinic-admin-icon" aria-label="Fine Dentistry">
      <span className="workspace-header-title">Fine Dentistry <span>Workspace</span></span>
    </span>
  );
}
export function LoginIntroduction() {
  return (
    <div className="clinic-login-intro">
      <h1>Clinic workspace</h1>
      <p>Sign in to manage your website and reception.</p>
      <Link href="/">← Back to the website</Link>
    </div>
  );
}
