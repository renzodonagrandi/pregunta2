import { defineRouting } from 'next-intl/routing'

// Spanish only. next-intl still owns every visible string (messages/es.json);
// the locale never shows up in URLs.
export const routing = defineRouting({
  locales: ['es'],
  defaultLocale: 'es',
  localePrefix: 'never',
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]
