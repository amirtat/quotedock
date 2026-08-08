'use server'

import { cookies } from 'next/headers'
import type { Lang } from '@/lib/i18n'

export async function setLangCookie(lang: Lang) {
  const cookieStore = await cookies()
  cookieStore.set('qdl', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 })
}
