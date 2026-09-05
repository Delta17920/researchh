import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "PolicyLens AI",
  description: "Cross-national policy deliberation and unintended consequence analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={sans.variable}>
        <div className="frame">
          <header className="nav">
            <Link href="/" className="brand">
              PolicyLens
              <span className="brand-tag">Decision support through structured disagreement.</span>
            </Link>
            <nav className="nav-links" aria-label="Primary">
              <Link href="/analyze">Analyze</Link>
              <span className="dot" aria-hidden>
                ·
              </span>
              <Link href="/debate">Debate</Link>
              <span className="dot" aria-hidden>
                ·
              </span>
              <Link href="/simulation">Simulate</Link>
              <span className="dot" aria-hidden>
                ·
              </span>
              <Link href="/#about">About</Link>
            </nav>
            <Link className="nav-cta" href="/analyze">
              Get started →
            </Link>
          </header>
          <div className="shell">{children}</div>
          <footer className="site-foot">
            <div>
              <strong>PolicyLens</strong>
              <p>Human–AI deliberation. No automatic implement decision.</p>
            </div>
            <div className="foot-links">
              <Link href="/analyze">Analyze</Link>
              <Link href="/debate">Debate</Link>
              <Link href="/simulation">Simulate</Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
