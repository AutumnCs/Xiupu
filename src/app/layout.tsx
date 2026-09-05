import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/utils/utils";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { LocaleSyncEffect } from "@/components/i18n/locale-sync-effect";
import { getServerLocale } from "@/lib/i18n/server-preference";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

// The platform stamps the real product title/description into .env at scaffold
// time (NEXT_PUBLIC_APP_TITLE / NEXT_PUBLIC_APP_DESCRIPTION). These drive the
// app's <title> / meta description. Fall back to a generic default when unset
// (e.g. local dev before any scaffold values are written).
const SITE_TITLE = process.env.NEXT_PUBLIC_APP_TITLE?.trim() || "秀谱 XiuPu";
const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION?.trim() || "秀演创作工作台";

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn("h-full antialiased", "font-sans", geist.variable)}
    >
      <body className="h-full flex flex-col">
        <I18nProvider>
          <LocaleSyncEffect />
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
