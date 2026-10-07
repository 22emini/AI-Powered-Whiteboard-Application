import Link from "next/link";

export const BRAND = "Syntheboard";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" id="logo-link">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" width={34} height={34} className="logo-mark" />
      {BRAND}
    </Link>
  );
}
