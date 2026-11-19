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
      <img
        src="/images/bannerlogo.webp"
        width="947"
        height="357"
        alt="Fine Dentistry of Downtown Orlando"
      />
    </span>
  );
}
export function LoginIntroduction() {
  return (
    <div className="clinic-login-intro">
      <h1>
        A little more control.
        <br />
        <em>A lot more possibility.</em>
      </h1>
      <p>Sign in to your clinic workspace.</p>
      <Link href="/">← Back to the website</Link>
    </div>
  );
}
