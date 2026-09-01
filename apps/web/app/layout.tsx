import type { Metadata } from "next";
import Link from "next/link";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "PolicyLens AI",
  description: "Cross-national policy deliberation and unintended consequence analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>
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
            <Link className="nav-cta" href="/analyze">
              Start
            </Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
