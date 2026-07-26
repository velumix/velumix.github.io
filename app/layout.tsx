import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velumix | Roblox Gameplay Engineer",
  description:
    "Roblox gameplay engineer building shipped experiences, reusable frameworks, Studio tooling, and production-ready Luau architecture.",
  metadataBase: new URL("https://velumix.ca.eu.org"),
  openGraph: {
    title: "Velumix | Roblox Gameplay Engineer",
    description:
      "Shipped Roblox gameplay, Nerve, Abraxius, simulation, AI, physics, data, and production systems.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05080b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
