import Link from "next/link";

type BrandLogoProps = {
  href: string;
  size?: "small" | "medium" | "large";
  tagline?: string;
  className?: string;
};

export function BrandLogo({
  href,
  size = "medium",
  tagline,
  className = "",
}: BrandLogoProps) {
  return (
    <Link
      className={`brand-logo brand-logo--${size} ${className}`.trim()}
      href={href}
      aria-label={href === "/dashboard" ? "VidyaMotion dashboard" : "VidyaMotion home"}
    >
      <span className="brand-logo__symbol" aria-hidden="true" />
      <span className="brand-logo__name" aria-hidden="true">
        <span>Vidya</span><span>Motion</span>
      </span>
      {tagline ? <span className="brand-logo__tagline">{tagline}</span> : null}
    </Link>
  );
}
