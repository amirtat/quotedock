import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, STATUS_LABELS } from '@/lib/utils'
import { Quote, QuoteStatus } from '@/lib/types'
import { Plus, ArrowRight, TrendingUp, FileText, Clock, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [quotesResult, profileResult] = await Promise.all([
    supabase.from('quotes').select('*, client:clients(name), items:quote_items(quantity, unit_price)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('profiles').select('business_name, currency').eq('id', user.id).single(),
  ])

  const quotes: any[] = quotesResult.data || []
  const currency = profileResult.data?.currency || 'ILS'
  const businessName = profileResult.data?.business_name

  const accepted = quotes.filter(q => q.status === 'accepted')
  const pending = quotes.filter(q => ['sent', 'viewed'].includes(q.status))
  const recentQuotes = quotes.slice(0, 6)

  const calcQuoteTotal = (q: any) =>
    (q.items || []).reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0) * (1 - (q.discount || 0) / 100)

  const acceptedRevenue = accepted.reduce((s, q) => s + calcQuoteTotal(q), 0)

  const statusBadgeVariant: Record<QuoteStatus, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
    draft: 'default', sent: 'info', viewed: 'warning', accepted: 'success', declined: 'danger',
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-muted text-sm mb-1">שלום,</p>
          <h1 className="text-3xl font-bold text-ink">{businessName || 'ברוך הבא'}</h1>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="h-4 w-4" />
            הצעה חדשה
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'סה"כ הצעות', value: quotes.length, icon: FileText, color: 'text-ink' },
          { label: 'ממתינות', value: pending.length, icon: Clock, color: 'text-amber-600' },
          { label: 'אושרו', value: accepted.length, icon: CheckCircle, color: 'text-success' },
          { label: 'הכנסות שאושרו', value: formatCurrency(acceptedRevenue, currency), icon: TrendingUp, color: 'text-saffron', large: true },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted uppercase tracking-wide font-medium">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className={`font-bold ${stat.large ? 'text-lg font-amount' : 'text-3xl'} ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent quotes */}
      <div className="bg-white rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">הצעות אחרונות</h2>
          <Link href="/dashboard/quotes" className="flex items-center gap-1 text-sm text-saffron hover:underline">
            הכל
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
              <FileText className="h-5 w-5 text-muted" />
            </div>
            <p className="text-ink font-medium mb-1">אין הצעות עדיין</p>
            <p className="text-muted text-sm mb-5">צור את ההצעה הראשונה שלך</p>
            <Link href="/dashboard/quotes/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                צור הצעה
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentQuotes.map((quote) => {
              const status = quote.status as QuoteStatus
              const statusInfo = STATUS_LABELS[status]
              const quoteTotal = calcQuoteTotal(quote)
              return (
                <Link
                  key={quote.id}
                  href={`/dashboard/quotes/${quote.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-surface/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink group-hover:text-saffron transition-colors">{quote.title}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {quote.client?.name || 'ללא לקוח'} · {format(new Date(quote.created_at), 'dd/MM/yy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {quoteTotal > 0 && (
                      <span className="font-amount text-sm font-medium text-ink">{formatCurrency(quoteTotal, currency)}</span>
                    )}
                    <Badge variant={statusBadgeVariant[status]}>{statusInfo.he}</Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
