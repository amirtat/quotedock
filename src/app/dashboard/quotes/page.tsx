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

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, client:clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allQuotes: Quote[] = quotes || []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">הצעות מחיר</h1>
          <p className="text-sm text-gray-500 mt-0.5">{allQuotes.length} הצעות</p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="h-4 w-4" />
            הצעה חדשה
          </Button>
        </Link>
      </div>

      {allQuotes.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-700 mb-2">אין הצעות מחיר עדיין</h2>
          <p className="text-gray-500 text-sm mb-6">צור הצעת מחיר מקצועית ושלח ללקוחות שלך</p>
          <Link href="/dashboard/quotes/new">
            <Button>
              <Plus className="h-4 w-4" />
              צור הצעה ראשונה
            </Button>
          </Link>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">כותרת</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">לקוח</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">מספר</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
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
                        <Link href={href} className="block py-3.5 text-gray-600">{(quote as any).client?.name || '—'}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5 text-gray-500 font-mono text-xs">{quote.number}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5 text-gray-500">{format(new Date(quote.created_at), 'dd/MM/yyyy')}</Link>
                      </td>
                      <td className="px-5 py-0">
                        <Link href={href} className="block py-3.5">
                          <Badge className={statusInfo.color}>{statusInfo.he}</Badge>
                        </Link>
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
