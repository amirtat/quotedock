import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  variable: '--font-heebo',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'QuoteDock - הצעות מחיר מקצועיות',
  description: 'צור והפץ הצעות מחיר מקצועיות בדקות',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="he" dir="rtl" className={`h-full ${heebo.variable}`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
