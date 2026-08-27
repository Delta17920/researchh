import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolicyLens AI",
  description: "Cross-national policy deliberation and unintended consequence analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <nav className="nav">
            <Link href="/" className="brand">
              Policy<span>Lens</span>
            </Link>
            <div className="nav-links">
              <Link href="/analyze">Analyze</Link>
              <Link href="/debate">Debate</Link>
              <Link href="/simulation">Simulation</Link>
            </div>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
