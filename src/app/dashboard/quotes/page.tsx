import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { STATUS_LABELS } from '@/lib/utils'
import { Quote } from '@/lib/types'
import { FileText, Plus, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { duplicateQuote } from '@/app/actions/quote-actions'
import { t, getLang } from '@/lib/i18n'

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [quotesResult, profileResult] = await Promise.all([
    supabase.from('quotes').select('*, client:clients(name)').eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('profiles').select('language').eq('id', user.id).single(),
  ])

  const allQuotes: Quote[] = (quotesResult.data || []).filter(q => !q.is_template)
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
        <Card>
          <CardContent className="p-0">
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-100">
              {allQuotes.map((quote) => {
                const statusInfo = STATUS_LABELS[quote.status]
                const href = `/dashboard/quotes/${quote.id}`
                return (
                  <div key={quote.id} className="flex items-center gap-3 px-4 py-3">
                    <Link href={href} className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{quote.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {(quote as any).client?.name || '-'} · {format(new Date(quote.created_at), 'dd/MM/yy')}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={statusInfo.color}>{statusInfo[lang]}</Badge>
                      <form action={duplicateQuote.bind(null, quote.id)}>
                        <button type="submit" title={T.duplicate} className="p-1.5 text-gray-300 hover:text-indigo-500 transition-colors rounded-lg hover:bg-indigo-50">
                          <Copy className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{T.quote_title}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{T.client}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{T.quote_number}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{T.quote_date}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{T.quote_status}</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allQuotes.map((quote) => {
                  const statusInfo = STATUS_LABELS[quote.status]
                  const href = `/dashboard/quotes/${quote.id}`
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5 font-medium text-gray-900">{quote.title}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5 text-gray-600">{(quote as any).client?.name || '-'}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5 text-gray-500 font-mono text-xs">{quote.number}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5 text-gray-500">{format(new Date(quote.created_at), 'dd/MM/yyyy')}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5">
                          <Badge className={statusInfo.color}>{statusInfo[lang]}</Badge>
                        </Link>
                      </td>
                      <td className="px-2 py-0">
                        <form action={duplicateQuote.bind(null, quote.id)}>
                          <button
                            type="submit"
                            title={T.duplicate}
                            className="p-2 text-gray-300 hover:text-indigo-500 transition-colors rounded-lg hover:bg-indigo-50"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
