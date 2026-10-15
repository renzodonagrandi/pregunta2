import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { locale as rootLocale } from 'next/root-params'
import { routing } from './routing'

export default getRequestConfig(async ({ locale: explicit }) => {
  // The root param is readable from any Server Component without making the
  // route dynamic, which keeps Cache Components' static shells intact.
  const requested = explicit ?? (await rootLocale())
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
