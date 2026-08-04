import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, STATUS_LABELS } from '@/lib/utils'
import { Quote } from '@/lib/types'
import { FileText, Users, TrendingUp, Plus, ArrowLeft } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [quotesResult, clientsResult] = await Promise.all([
    supabase
      .from('quotes')
      .select('*, client:clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('clients').select('id').eq('user_id', user.id),
  ])

  const quotes: Quote[] = quotesResult.data || []
  const clientCount = clientsResult.data?.length || 0

  const accepted = quotes.filter((q) => q.status === 'accepted')
  const pending = quotes.filter((q) => ['sent', 'viewed'].includes(q.status))
  const recentQuotes = quotes.slice(0, 5)

  const potentialRevenue = pending.reduce((sum, q) => {
    const items = (q as any).items || []
    return sum + items.reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0)
  }, 0)

  const stats = [
    { label: 'סה"כ הצעות', value: quotes.length, icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'הצעות שאושרו', value: accepted.length, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'ממתינות לאישור', value: pending.length, icon: FileText, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'לקוחות', value: clientCount, icon: Users, color: 'text-blue-600 bg-blue-50' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">לוח בקרה</h1>
          <p className="text-sm text-gray-500 mt-0.5">ברוך הבא ל-QuoteDock</p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="h-4 w-4" />
            הצעה חדשה
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>הצעות אחרונות</CardTitle>
            <Link href="/dashboard/quotes" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              כל ההצעות
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentQuotes.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">אין הצעות מחיר עדיין</p>
              <Link href="/dashboard/quotes/new">
                <Button size="sm">צור הצעה ראשונה</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentQuotes.map((quote) => {
                const statusInfo = STATUS_LABELS[quote.status]
                return (
                  <Link
                    key={quote.id}
                    href={`/dashboard/quotes/${quote.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-5 px-5 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{quote.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {quote.number} · {(quote as any).client?.name || 'ללא לקוח'}
                      </p>
                    </div>
                    <Badge className={statusInfo.color}>{statusInfo.he}</Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
