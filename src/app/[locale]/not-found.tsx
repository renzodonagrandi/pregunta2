import { getTranslations } from 'next-intl/server'
import { BackButton } from '@/components/back-button'
import { Mark } from '@/components/brand/logo'
import { buttonClass } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const [t, tc] = await Promise.all([
    getTranslations('Errors'),
    getTranslations('Common'),
  ])
  return (
    <main className='mx-auto flex w-full max-w-md flex-1 flex-col items-start justify-center gap-5 px-5'>
      <BackButton label={tc('back')} className='-ml-2 text-chalk' />
      <Mark className='h-10 w-14 text-chalk' />
      <h1 className='font-display text-3xl font-bold'>{t('notFoundTitle')}</h1>
      <Link href='/' className={buttonClass('primary')}>
        {t('backHome')}
      </Link>
    </main>
  )
}
