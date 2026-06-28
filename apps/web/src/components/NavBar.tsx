"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeBadge } from "./ModeBadge";

const LINKS = [
  { href: "/guide", label: "Guide" },
  { href: "/docs", label: "Why MetaAsset" },
  { href: "/creator", label: "Creator" },
  { href: "/play", label: "Play" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/70 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent2 text-sm font-bold text-ink">
            M
          </span>
          Meta<span className="text-accent">Asset</span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href} className={`nav-link ${active ? "nav-link-active" : ""}`}>
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ModeBadge />
          <Link href="/guide" className="btn px-3 py-1.5 text-sm sm:hidden">
            Start
          </Link>
        </div>
      </nav>

      {/* Mobile link row */}
      <div className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 sm:hidden">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link key={l.href} href={l.href} className={`nav-link whitespace-nowrap ${active ? "nav-link-active" : ""}`}>
              {l.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
