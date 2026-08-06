import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency, calcTotal, STATUS_LABELS, intervalLabel } from '@/lib/utils'
import { format } from 'date-fns'
import PublicQuoteActions from '@/components/quotes/public-quote-actions'

export default async function PublicQuotePage({ params }: PageProps<'/q/[token]'>) {
  const { token } = await params
  const supabase = await createClient()

  // Get quote by public token
  const { data: quote } = await supabase
    .from('quotes')
    .select('*, client:clients(*)')
    .eq('public_token', token)
    .single()

  if (!quote) notFound()

  // Mark as viewed if first time
  if (quote.status === 'sent' && !quote.viewed_at) {
    await supabase
      .from('quotes')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('id', quote.id)
  }

  // Get items and profile
  const [itemsResult, profileResult, signatureResult, milestonesResult] = await Promise.all([
    supabase.from('quote_items').select('*').eq('quote_id', quote.id).order('sort_order'),
    supabase.from('profiles').select('*').eq('id', quote.user_id).single(),
    supabase.from('signatures').select('*').eq('quote_id', quote.id).single(),
    supabase.from('payment_milestones').select('*').eq('quote_id', quote.id).order('sort_order'),
  ])

  const items = itemsResult.data || []
  const profile = profileResult.data
  const signature = signatureResult.data
  const vatRate = profile?.vat_rate ?? 18
  const currency = profile?.currency || 'ILS'
  const { subtotal, discountAmount, vatAmount, total, recurringSubtotal } = calcTotal(items as any, quote.discount, vatRate, quote.include_vat, (quote as any).discount_type || 'percent')
  const isPending = ['sent', 'viewed'].includes(quote.status)
  const isAccepted = quote.status === 'accepted'
  const isDeclined = quote.status === 'declined'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Status banner */}
        {isAccepted && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 p-4 text-center text-green-700 font-medium">
            ✓ ההצעה אושרה — תודה!
          </div>
        )}
        {isDeclined && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-center text-red-700 font-medium">
            ההצעה נדחתה
          </div>
        )}

        {/* Quote document */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quote.title}</h1>
              <p className="text-gray-500 mt-1 font-mono text-sm">{quote.number}</p>
              <p className="text-gray-500 text-sm mt-0.5">
                {format(new Date(quote.created_at), 'dd/MM/yyyy')}
              </p>
              {quote.valid_until && (
                <p className="text-sm text-orange-600 mt-1">
                  בתוקף עד: {format(new Date(quote.valid_until), 'dd/MM/yyyy')}
                </p>
              )}
            </div>
            <div className="text-left flex flex-col items-end gap-1">
              {profile?.logo_url && (
                <img src={profile.logo_url} alt={profile?.business_name || ''} className="h-14 max-w-[160px] object-contain mb-1" />
              )}
              <p className="font-bold text-gray-900 text-lg">{profile?.business_name}</p>
              {profile?.email && <p className="text-sm text-gray-500">{profile.email}</p>}
              {profile?.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
              {profile?.address && <p className="text-sm text-gray-500">{profile.address}</p>}
            </div>
          </div>

          {/* Client */}
          {(quote as any).client && (
            <div className="mb-8 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-1">הצעה עבור</p>
              <p className="font-semibold text-gray-900 text-lg">{(quote as any).client.name}</p>
              {(quote as any).client.company && <p className="text-gray-600">{(quote as any).client.company}</p>}
              {(quote as any).client.email && <p className="text-sm text-gray-500">{(quote as any).client.email}</p>}
            </div>
          )}

          {/* Recurring items summary */}
          {recurringSubtotal > 0 && (
            <div className="mb-6 p-4 bg-saffron-50 border border-saffron-100 rounded-xl">
              <p className="text-xs font-semibold text-saffron-600 uppercase tracking-wide mb-2">תשלומים חוזרים</p>
              {(['monthly', 'quarterly', 'yearly'] as const).map(interval => {
                const intervalItems = (items as any[]).filter((i: any) => i.item_type === 'recurring' && (i.recurring_interval || 'monthly') === interval)
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
                <th className="text-right py-3 font-semibold text-gray-700">פריט</th>
                <th className="text-center py-3 font-semibold text-gray-700 w-20">כמות</th>
                <th className="text-center py-3 font-semibold text-gray-700 w-28">מחיר יחידה</th>
                <th className="text-left py-3 font-semibold text-gray-700 w-28">סה&quot;כ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3.5">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>}
                  </td>
                  <td className="py-3.5 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-3.5 text-center text-gray-700">{formatCurrency(item.unit_price, currency)}</td>
                  <td className="py-3.5 text-left font-medium">{formatCurrency(item.quantity * item.unit_price, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 flex flex-col gap-2 text-sm">
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
              <div className="flex justify-between border-t-2 border-gray-200 pt-3 font-bold text-lg">
                <span>סה&quot;כ לתשלום</span>
                <span className="text-indigo-600">{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="pt-6 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">הערות</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Actions / Signature */}
        {isPending && (
          <PublicQuoteActions quoteId={quote.id} />
        )}

        {/* Existing signature */}
        {signature && (
          <div className="mt-4 bg-white rounded-2xl border border-green-200 p-6">
            <p className="text-green-700 font-medium mb-3 text-center">✓ ההצעה אושרה ונחתמה</p>
            {signature.signature_data?.startsWith('data:image') && (
              <div className="border border-gray-100 rounded-lg bg-gray-50 p-2 mb-3">
                <img src={signature.signature_data} alt="חתימה" className="max-h-24 mx-auto" />
              </div>
            )}
            <p className="text-center text-sm text-gray-600">{signature.signer_name}</p>
            <p className="text-center text-gray-400 text-xs mt-0.5">{format(new Date(signature.signed_at), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted/40 mt-6">
          Powered by{' '}
          <a href="http://www.tripleai.co.il" target="_blank" rel="noopener noreferrer" className="font-medium text-muted/60 hover:text-muted/80 transition-colors">
            TripleA.I
          </a>
        </p>
      </div>
    </div>
  )
}
