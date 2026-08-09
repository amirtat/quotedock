import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { Lang } from '@/lib/i18n'

export default async function FaqPage() {
  const cookieStore = await cookies()
  const lang: Lang = cookieStore.get('qdl')?.value === 'en' ? 'en' : 'he'

  const supabase = await createClient()
  const { data: faqs } = await supabase
    .from('faqs')
    .select('question, answer')
    .eq('lang', lang)
    .order('sort_order')

  const title = lang === 'en' ? 'FAQ' : 'שאלות נפוצות'
  const subtitle = lang === 'en' ? 'Everything you need to know about QuoteDock' : 'כל מה שצריך לדעת על QuoteDock'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-500">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-3">
          {(faqs || []).map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
              <p className="font-semibold text-gray-900 mb-2">{item.question}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          Powered by{' '}
          <a href="http://www.tripleai.co.il" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-500 hover:text-gray-700 transition-colors">
            TripleA.I
          </a>
        </p>
      </div>
    </div>
  )
}
