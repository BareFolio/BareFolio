import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SetupPage from "./setup/page";
import { AppProvider } from "@/lib/store";
import GlobalShell from "@/components/GlobalShell";

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
  title: "BareFolio - The Visual Portfolio Network",
  description: "Showcase premium design portfolios, share visual updates, and connect with creative agencies and brands.",
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
      </body>
    </html>
  );
}




