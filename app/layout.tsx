import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
import { getLocale } from "@/lib/i18n/server";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/infrastructure/theme/ThemeProvider";
import { themeScript } from "@/infrastructure/theme/theme-script";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Backstage | The Artist's Command Center",
  description: "Automated community growth and management for modern artists.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Detect user's preferred locale on the server
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${instrumentSerif.variable} ${inter.variable} antialiased transition-colors duration-200`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <I18nProvider initialLocale={locale}>
            <ThemeProvider defaultTheme="system">
              {children}
            </ThemeProvider>
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
