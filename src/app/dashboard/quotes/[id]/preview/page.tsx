import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, formatCurrency, calcTotal, intervalLabel } from '@/lib/utils'
import { QuoteStatus } from '@/lib/types'
import { ArrowLeft, Edit, Copy } from 'lucide-react'
import { format } from 'date-fns'
import CopyLinkButton from '@/components/quotes/copy-link-button'
import DuplicateQuoteButton from '@/components/quotes/duplicate-quote-button'
import PrintButton from '@/components/quotes/print-button'
import DeleteQuoteButton from '@/components/quotes/delete-quote-button'

export default async function QuotePreviewPage({ params }: PageProps<'/dashboard/quotes/[id]/preview'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [quoteResult, itemsResult, profileResult, milestonesResult, attachmentsResult] = await Promise.all([
    supabase.from('quotes').select('*, client:clients(*)').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('payment_milestones').select('*').eq('quote_id', id).order('sort_order'),
    supabase.from('quote_attachments').select('*').eq('quote_id', id).order('sort_order'),
  ])

  if (!quoteResult.data) notFound()

  const quote = quoteResult.data
  const items = itemsResult.data || []
  const profile = profileResult.data
  const milestones = milestonesResult.data || []
  const vatRate = profile?.vat_rate ?? 18
  const currency = profile?.currency || 'ILS'
  const statusInfo = STATUS_LABELS[quote.status as QuoteStatus]
  const { subtotal, discountAmount, vatAmount, total, recurringSubtotal } = calcTotal(items as any, quote.discount, vatRate, quote.include_vat, (quote as any).discount_type || 'percent')

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/q/${quote.public_token}`

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Actions bar */}
      <div className="no-print flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/quotes/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            חזרה לעריכה
          </Link>
          <DeleteQuoteButton quoteId={id} />
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <DuplicateQuoteButton quoteId={id} />
          <CopyLinkButton url={publicUrl} />
          <Badge className={statusInfo.color}>{statusInfo.he}</Badge>
        </div>
      </div>

      {/* Quote document */}
      <div className="print-doc bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quote.title}</h1>
            <p className="text-gray-500 mt-1 font-mono text-sm">{quote.number}</p>
            <p className="text-gray-500 text-sm mt-0.5">
              {format(new Date(quote.created_at), 'dd/MM/yyyy')}
            </p>
            {quote.valid_until && (
              <p className="text-gray-500 text-sm">
                בתוקף עד: {format(new Date(quote.valid_until), 'dd/MM/yyyy')}
              </p>
            )}
          </div>
          <div className="text-left flex flex-col items-end gap-1">
            {profile?.logo_url && (
              <img src={profile.logo_url} alt={profile.business_name || ''} className="h-12 max-w-[140px] object-contain mb-1" />
            )}
            <p className="font-bold text-gray-900">{profile?.business_name}</p>
            {profile?.email && <p className="text-sm text-gray-500">{profile.email}</p>}
            {profile?.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
          </div>
        </div>

        {/* Client */}
        {(quote as any).client && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">לקוח</p>
            <p className="font-medium text-gray-900">{(quote as any).client.name}</p>
            {(quote as any).client.company && <p className="text-sm text-gray-600">{(quote as any).client.company}</p>}
            {(quote as any).client.email && <p className="text-sm text-gray-500">{(quote as any).client.email}</p>}
          </div>
        )}

        {/* Recurring items summary */}
        {recurringSubtotal > 0 && (
          <div className="mb-6 p-4 bg-saffron-50 border border-saffron-100 rounded-xl">
            <p className="text-xs font-semibold text-saffron-600 uppercase tracking-wide mb-2">תשלומים חוזרים</p>
            {(['monthly', 'quarterly', 'yearly'] as const).map(interval => {
              const intervalItems = (items as any[]).filter(i => i.item_type === 'recurring' && (i.recurring_interval || 'monthly') === interval)
              const intervalTotal = intervalItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0)
              if (intervalTotal === 0) return null
              return (
                <div key={interval} className="flex justify-between text-sm">
                  <span className="text-gray-600">{intervalLabel(interval)}</span>
                  <span className="font-semibold text-saffron-700">{formatCurrency(intervalTotal, currency)}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-right py-2 font-semibold text-gray-700">פריט</th>
              <th className="text-center py-2 font-semibold text-gray-700">כמות</th>
              <th className="text-center py-2 font-semibold text-gray-700">מחיר יחידה</th>
              <th className="text-left py-2 font-semibold text-gray-700">סה&quot;כ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.description && <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>}
                </td>
                <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                <td className="py-3 text-center text-gray-700">{formatCurrency(item.unit_price, currency)}</td>
                <td className="py-3 text-left font-medium">{formatCurrency(item.quantity * item.unit_price, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-60 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">סכום ביניים</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>
                  {(quote as any).discount_reason ? `הנחה — ${(quote as any).discount_reason}` : 'הנחה'}
                  {(quote as any).discount_type !== 'fixed' && ` (${quote.discount}%)`}
                </span>
                <span>-{formatCurrency(discountAmount, currency)}</span>
              </div>
            )}
            {quote.include_vat && vatRate > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>מע&quot;מ ({vatRate}%)</span>
                <span>{formatCurrency(vatAmount, currency)}</span>
              </div>
            )}
            {vatRate === 0 && (
              <div className="flex justify-between text-gray-500 text-xs">
                <span>פטור ממע&quot;מ (עוסק זעיר)</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-gray-200 pt-2 font-bold text-base">
              <span>סה&quot;כ לתשלום</span>
              <span className="text-indigo-600">{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Payment schedule */}
        {milestones.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">לוח תשלומים</p>
            <div className="flex flex-col gap-1.5">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{i + 1}. {m.title}</span>
                  <div className="flex items-center gap-4 text-left">
                    {m.due_date && <span className="text-gray-400 text-xs">{format(new Date(m.due_date), 'dd/MM/yyyy')}</span>}
                    <span className="text-gray-500 w-10 text-center">{m.percent}%</span>
                    <span className="font-medium text-gray-900 w-24 text-left">{formatCurrency(total * m.percent / 100, currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">הערות</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}
      </div>

      {/* Status timeline — freelancer only, not printed */}
      <div className="no-print mt-4 bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-medium text-gray-500 uppercase mb-3">ציר זמן</p>
        <div className="flex flex-col gap-2">
          {[
              { label: 'נוצרה', ts: quote.created_at },
              { label: 'נשלחה', ts: quote.sent_at },
              { label: 'נצפתה', ts: quote.viewed_at },
              { label: 'אושרה', ts: quote.accepted_at },
              { label: 'נדחתה', ts: quote.declined_at },
            ]
              .filter((e) => e.ts)
              .map((e) => (
                <div key={e.label} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-gray-500 shrink-0">{e.label}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                  <span className="text-gray-700 font-mono text-xs">
                    {format(new Date(e.ts!), 'dd/MM/yyyy HH:mm')}
                  </span>
                  {e.label === 'נצפתה' && quote.sent_at && (
                    <span className="text-xs text-gray-400">
                      ({Math.round((new Date(e.ts!).getTime() - new Date(quote.sent_at).getTime()) / 3600000)} שע' מהשליחה)
                    </span>
                  )}
                  {(e.label === 'אושרה' || e.label === 'נדחתה') && quote.sent_at && (
                    <span className="text-xs text-gray-400">
                      ({Math.round((new Date(e.ts!).getTime() - new Date(quote.sent_at).getTime()) / 86400000)} ימים מהשליחה)
                    </span>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}
