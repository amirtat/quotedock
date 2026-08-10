import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Quote } from '@/lib/types'
import { FileText, Plus } from 'lucide-react'
import { t, getLang } from '@/lib/i18n'
import { QuotesList } from '@/components/quotes/quotes-list'

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [quotesResult, profileResult] = await Promise.all([
    supabase.from('quotes').select('*, client:clients(name)').eq('user_id', user.id).eq('is_template', false).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('profiles').select('language').eq('id', user.id).single(),
  ])

  const allQuotes: Quote[] = quotesResult.data || []
  const lang = getLang(profileResult.data?.language || 'he')
  const T = t[lang]

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{T.quotes}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{allQuotes.length} {T.quotes}</p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="h-4 w-4" />
            {T.new_quote}
          </Button>
        </Link>
      </div>

      {allQuotes.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-700 mb-2">{T.no_quotes}</h2>
          <p className="text-gray-500 text-sm mb-6">{T.no_quotes_desc}</p>
          <Link href="/dashboard/quotes/new">
            <Button>
              <Plus className="h-4 w-4" />
              {T.create_first_quote}
            </Button>
          </Link>
        </div>
      ) : (
        <QuotesList quotes={allQuotes} />
      )}
    </div>
  )
}
