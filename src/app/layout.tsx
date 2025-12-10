import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "GenSpa",
  title: {
    default: "GenSpa | Premium Spa & Wellness",
    template: "%s | GenSpa",
  },
  description:
    "Signature spa rituals, certified therapists and real-time booking across GenSpa studios in India.",
  openGraph: {
    type: "website",
    siteName: "GenSpa",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#233D32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-offwhite font-sans text-charcoal antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
