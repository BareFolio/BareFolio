import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SetupScreen from "./setup/SetupScreen";
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
  title: {
    default: 'BareFolio',
    template: '%s | BareFolio',
  },
  description: "All your creative world in one place. BareFolio is a creative portfolio platform for designers, photographers, art directors, and filmmakers. Showcase your work, share your process, and connect with the people who move the creative industry.",
  keywords: ["creative portfolio", "portfolio platform", "designers", "photographers", "art directors", "filmmakers", "creative professionals", "visual portfolio"],
  alternates: {
    canonical: 'https://barefolio.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [{ url: "/favicon.svg?v=2", type: "image/svg+xml" }],
    shortcut: "/favicon.svg?v=2",
  },
  openGraph: {
    title: "BareFolio — All your creative world in one place",
    description: "BareFolio is a creative portfolio platform for designers, photographers, art directors, and filmmakers. Showcase your work, share your process, and connect with the people who move the creative industry.",
    url: "https://barefolio.com",
    siteName: "BareFolio",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "BareFolio — Creative portfolio platform" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BareFolio — All your creative world in one place",
    description: "BareFolio is a creative portfolio platform for designers, photographers, art directors, and filmmakers. Showcase your work, share your process, and connect with the people who move the creative industry.",
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
          <SetupScreen />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${switzer.variable} ${geist.variable}`}>
      <head>
        {/* Google Consent Mode v2 — must run before GTM */}
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}(function(){var c='denied';try{if(localStorage.getItem('bf_cookies_consent')==='accepted')c='granted';}catch(e){}gtag('consent','default',{ad_storage:c,analytics_storage:c,ad_user_data:c,ad_personalization:c,functionality_storage:c,personalization_storage:c,security_storage:'granted'});})();`}} />
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-PJ85XQ4W');`}} />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-YM9TGHDTC8" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-YM9TGHDTC8');`}} />
      </head>
      <body className="antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PJ85XQ4W" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} /></noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "name": "BareFolio",
                "url": "https://barefolio.com",
                "description": "A creative portfolio platform for designers, photographers, art directors, and filmmakers."
              },
              {
                "@type": "Organization",
                "name": "BareFolio",
                "url": "https://barefolio.com",
                "logo": "https://barefolio.com/ISOLOGO BLACK.svg",
                "sameAs": [
                  "https://www.instagram.com/barefolio.app/",
                  "https://www.tiktok.com/@barefolio",
                  "https://x.com/barefolio",
                  "https://www.linkedin.com/company/barefolio"
                ],
                "description": "A creative portfolio platform for designers, photographers, art directors, and filmmakers."
              }
            ]
          })}}
        />
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




