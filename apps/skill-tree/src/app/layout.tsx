import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Orbitron, Share_Tech_Mono, Space_Grotesk } from "next/font/google";
import { themeInitScript } from "@/components/ThemeToggle";
import "./globals.css";

const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["500", "700"] });
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
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
      <body className={`${grotesk.variable} ${plexSans.variable} ${plexMono.variable} ${orbitron.variable} ${shareTech.variable}`}>
        {children}
      </body>
    </html>
  );
}
