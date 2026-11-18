import { siteConfig } from "@/lib/site-data";

export function FooterSocialIcons({
  className = "footer-social-icons",
}: {
  className?: string;
}) {
  return (
    <div className={className}>
      <a
        href={siteConfig.facebook}
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M16.5 3h-2a4 4 0 0 0-4 4v14M7 10.5h9" />
        </svg>
      </a>
      <a
        href={siteConfig.instagram}
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4.1" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </a>
    </div>
  );
}

