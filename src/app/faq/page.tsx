import { createClient } from '@/lib/supabase/server'

export default async function FaqPage() {
  const supabase = await createClient()
  const { data: faqs } = await supabase
    .from('faqs')
    .select('question, answer')
    .order('sort_order')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">שאלות נפוצות</h1>
          <p className="text-gray-500">כל מה שצריך לדעת על QuoteDock</p>
        </div>

        <div className="flex flex-col gap-3">
          {(faqs || []).map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
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
