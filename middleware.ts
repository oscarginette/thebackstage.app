import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  // List of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'en',

  // Always use locale prefix for landing page
  localePrefix: 'always'
});

export const config = {
  // Only apply i18n middleware to the landing page (root and locale paths)
  // Exclude dashboard, api, stats, unsubscribe, and other app routes
  matcher: [
    '/',
    '/(en|es)/:path*',
    '/((?!api|dashboard|stats|unsubscribe|login|_next|.*\\..*).*)'
  ]
};
