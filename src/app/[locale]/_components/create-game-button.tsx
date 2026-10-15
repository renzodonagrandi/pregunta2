'use client'

import { useTranslations } from 'next-intl'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

export function CreateGameButton() {
  const t = useTranslations('Home')
  const { pending } = useFormStatus()
  return (
    <Button type='submit' className='w-full text-lg' disabled={pending}>
      {pending ? t('creating') : t('create')}
    </Button>
  )
}
