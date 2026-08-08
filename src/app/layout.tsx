import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import { cookies } from 'next/headers'
import { LangProvider } from '@/lib/lang-context'
import type { Lang } from '@/lib/i18n'
import './globals.css'

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  variable: '--font-heebo',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'QuoteDock',
  description: 'Professional quotes, fast',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const cookieStore = await cookies()
  const lang: Lang = cookieStore.get('qdl')?.value === 'en' ? 'en' : 'he'
  const dir = lang === 'en' ? 'ltr' : 'rtl'

  return (
    <html lang={lang} dir={dir} className={`h-full ${heebo.variable}`}>
      <body className="min-h-full antialiased">
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  )
}
