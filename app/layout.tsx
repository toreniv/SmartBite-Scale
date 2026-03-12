import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartBite Scale",
  description: "Smart food scale companion app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
