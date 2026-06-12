import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SetupPage from "./setup/page";
import { AppProvider } from "@/lib/store";
import GlobalShell from "@/components/GlobalShell";
import CookieBanner from "@/components/CookieBanner";

const switzer = localFont({
  src: [
    {
      path: "../../public/fonts/Switzer-Variable.woff2",
      style: "normal",
    },
    {
      path: "../../public/fonts/Switzer-VariableItalic.woff2",
      style: "italic",
    }
  ],
  variable: "--font-display",
});

const geist = localFont({
  src: [
    {
      path: "../../public/fonts/Geist-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "../../public/fonts/Geist-Italic-VariableFont_wght.ttf",
      style: "italic",
    }
  ],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://barefolio.com'),
  title: "BareFolio - The Visual Portfolio Network",
  description: "Showcase premium design portfolios, share visual updates, and connect with creative agencies and brands.",
  icons: {
    icon: [{ url: "/favicon.svg?v=2", type: "image/svg+xml" }],
    shortcut: "/favicon.svg?v=2",
  },
  openGraph: {
    title: "BareFolio - The Visual Portfolio Network",
    description: "Showcase premium design portfolios, share visual updates, and connect with creative agencies and brands.",
    url: "https://barefolio.com",
    siteName: "BareFolio",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "BareFolio" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BareFolio - The Visual Portfolio Network",
    description: "Showcase premium design portfolios, share visual updates, and connect with creative agencies and brands.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasSupabaseKeys = 
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseKeys) {
    return (
      <html lang="en" className={`${switzer.variable} ${geist.variable}`}>
        <body>
          <SetupPage />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${switzer.variable} ${geist.variable}`}>
      <body className="antialiased">
        <AppProvider>
          <GlobalShell>
            {children}
          </GlobalShell>
        </AppProvider>
        <CookieBanner />
      </body>
    </html>
  );
}




