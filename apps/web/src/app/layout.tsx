import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta-Asset — Decentralized Game CDN",
  description: "Universal high-speed CDN for Web3 game studios, powered by the Shelby Protocol on Aptos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
        <header className="border-b border-white/10">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Meta<span className="text-accent">Asset</span>
            </Link>
            <div className="flex gap-2 text-sm">
              <Link href="/creator" className="btn-ghost">
                Creator Portal
              </Link>
              <Link href="/play" className="btn-ghost">
                Game Client
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
