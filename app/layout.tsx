import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velumix — Gameplay Engineer",
  description:
    "Gameplay engineer and software engineer focused on responsive Roblox systems, scalable architecture, and production-ready tools.",
  metadataBase: new URL("https://velumix.ca.eu.org"),
  openGraph: {
    title: "Velumix — Gameplay Engineer",
    description:
      "Responsive gameplay. Scalable systems. Production-minded engineering.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070a0f",
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
