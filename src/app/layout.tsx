import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuoteDock - הצעות מחיר מקצועיות',
  description: 'צור והפץ הצעות מחיר מקצועיות בדקות',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
