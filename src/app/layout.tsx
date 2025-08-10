import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthGuard from "./components/AuthGuard";
import CookieConsentBanner from "./components/CookieConsentBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yurtsever - Konaklama Yönetim Sistemi",
  description: "Profesyonel konaklama kayıt ve takip platformu",
  keywords: "konaklama, yönetim, otel, kayıt, takip",
  authors: [{ name: "Yurtsever" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#3B82F6" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthGuard>{children}</AuthGuard>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
