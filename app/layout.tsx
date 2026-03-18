import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/hooks/useLanguage";

export const metadata: Metadata = {
  title: "SmartBite Scale",
  description: "Smart food scale companion app",
  icons: {
    icon: "/assets/icons/favicon-32x32.png",
    shortcut: "/assets/icons/favicon-16x16.png",
    apple: "/assets/icons/apple-touch-icon.png",
  },
  manifest: "/assets/icons/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
