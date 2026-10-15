import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('Errors')
  return (
    <main className='mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center'>
      <h1 className='text-2xl font-bold'>{t('notFoundTitle')}</h1>
      <Link href='/' className='font-medium underline'>
        {t('backHome')}
      </Link>
    </main>
  )
}
