import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MetaAsset — Decentralized Game CDN",
  description: "Universal high-speed CDN for Web3 game studios, powered by the Shelby Protocol on Aptos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          <NavBar />
          <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
          <footer className="mt-16 border-t border-white/10">
            <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Meta<span className="text-accent">Asset</span> — decentralized game CDN on Shelby + Aptos
              </span>
              <div className="flex flex-wrap gap-4">
                <Link href="/guide" className="hover:text-zinc-200">
                  Guide
                </Link>
                <Link href="/docs" className="hover:text-zinc-200">
                  Why MetaAsset
                </Link>
                <a
                  href="https://github.com/Starling-spell/meta-asset-cdn"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-zinc-200"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
