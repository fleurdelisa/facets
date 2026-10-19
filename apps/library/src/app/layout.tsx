import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Commonplace",
  description: "Quotes worth keeping — from books, podcasts, films and more.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${newsreader.variable} font-sans antialiased`}>
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-serif text-2xl italic tracking-tight">
              Commonplace
            </Link>
            <Link
              href="/quotes/new"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent/90"
            >
              + New quote
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
