import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://fleurdelisa.dev"),
  title: { default: "fleurdelisa · a digital garden", template: "%s · fleurdelisa" },
  description: "A personal digital garden: writing, recipes, experiments, and a map of the apps I've built.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/" className="wordmark">
            fleur<span>de</span>lisa
          </Link>
          <SiteNav />
        </header>
        <main>{children}</main>
        <footer className="site-footer">Tended by hand. Growing slowly.</footer>
      </body>
    </html>
  );
}
