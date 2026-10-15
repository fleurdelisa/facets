import type { Metadata } from "next";
import { Cinzel, EB_Garamond, Orbitron, Share_Tech_Mono } from "next/font/google";
import { themeInitScript } from "@/components/ThemeToggle";
import "./globals.css";

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "700"] });
const garamond = EB_Garamond({ variable: "--font-garamond", subsets: ["latin"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"], weight: ["500", "700"] });
const shareTech = Share_Tech_Mono({ variable: "--font-share-tech", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Skill Tree · Facets",
  description: "Everything I've invested time in learning, laid out as a skill tree.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${cinzel.variable} ${garamond.variable} ${orbitron.variable} ${shareTech.variable}`}>
        {children}
      </body>
    </html>
  );
}
