import { useTranslations } from 'next-intl'

/** Desktop-only reminder of the rules, filling the column under the scores. */
export function RulesCard() {
  const t = useTranslations('Match.rules')
  return (
    <section className='mt-6 hidden flex-col gap-3 border-t border-night-700 pt-5 lg:flex'>
      <h2 className='font-display text-sm font-semibold text-mist'>
        {t('title')}
      </h2>
      <ul className='flex flex-col gap-3 text-sm leading-relaxed text-chalk/75'>
        {(['spin', 'prize', 'win'] as const).map(key => (
          <li key={key} className='flex gap-3'>
            <span className='mt-2 h-1 w-3 shrink-0 bg-amber' aria-hidden />
            {t(`items.${key}`)}
          </li>
        ))}
      </ul>
    </section>
  )
}
