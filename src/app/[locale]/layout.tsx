import type { Metadata, Viewport } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Atkinson_Hyperlegible_Next, Oxanium } from 'next/font/google'
import { notFound } from 'next/navigation'
import { locale as rootLocale } from 'next/root-params'
import { routing } from '@/i18n/routing'
import '../globals.css'

// Both are variable fonts, self-hosted by next/font and subset to Latin:
// two small preloaded files, no runtime request to Google.
const display = Oxanium({
  variable: '--font-oxanium',
  subsets: ['latin'],
})

const text = Atkinson_Hyperlegible_Next({
  variable: '--font-atkinson',
  subsets: ['latin'],
  // next/font has no metrics for this family to build an adjusted fallback;
  // it is preloaded, so the system font only shows on very slow first loads.
  adjustFontFallback: false,
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
})

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export const viewport: Viewport = {
  themeColor: '#1a2238',
  colorScheme: 'dark',
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')
  return {
    title: { default: t('title'), template: `%s · ${t('title')}` },
    description: t('description'),
    applicationName: t('title'),
    openGraph: { siteName: t('title'), locale: 'es', type: 'website' },
  }
}

export default async function LocaleLayout({
  children,
}: LayoutProps<'/[locale]'>) {
  const locale = await rootLocale()
  if (!hasLocale(routing.locales, locale)) notFound()

  return (
    <html
      lang={locale}
      className={`${display.variable} ${text.variable} h-full`}
    >
      <body className='flex min-h-full flex-col'>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
