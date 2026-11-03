import Link from "next/link";

type BrandLogoProps = {
  href: string;
  size?: "small" | "medium" | "large" | "xlarge";
  tagline?: string;
  className?: string;
  showText?: boolean;
};

export function BrandLogo({
  href,
  size = "medium",
  tagline,
  className = "",
  showText = true,
}: BrandLogoProps) {
  return (
    <Link
      className={`brand-logo brand-logo--${size} ${className}`.trim()}
      href={href}
      aria-label={href === "/dashboard" ? "VidyaMotion dashboard" : "VidyaMotion home"}
    >
      <span className="brand-logo__symbol" aria-hidden="true" />
      {showText && (
        <span className="brand-logo__name" aria-hidden="true">
          <span>Vidya</span><span>Motion</span>
        </span>
      )}
      {tagline && showText ? <span className="brand-logo__tagline">{tagline}</span> : null}
    </Link>
  );
}
