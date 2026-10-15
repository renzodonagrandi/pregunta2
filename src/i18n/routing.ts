import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'pt-BR'],
  defaultLocale: 'es',
  // `/j/[slug]` stays clean for the default locale; pt-BR lives under `/pt-BR/...`
  localePrefix: 'as-needed',
  // The play page follows the game's locale, not the visitor's; locales are
  // only switched explicitly (selector), never by cookie/Accept-Language.
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]
