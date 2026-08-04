import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, formatCurrency, calcTotal } from '@/lib/utils'
import { QuoteStatus } from '@/lib/types'
import { ArrowRight, Edit, Copy } from 'lucide-react'
import { format } from 'date-fns'
import CopyLinkButton from '@/components/quotes/copy-link-button'

export default async function QuotePreviewPage({ params }: PageProps<'/dashboard/quotes/[id]/preview'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [quoteResult, itemsResult, profileResult] = await Promise.all([
    supabase.from('quotes').select('*, client:clients(*)').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!quoteResult.data) notFound()

  const quote = quoteResult.data
  const items = itemsResult.data || []
  const profile = profileResult.data
  const vatRate = profile?.vat_rate ?? 18
  const currency = profile?.currency || 'ILS'
  const statusInfo = STATUS_LABELS[quote.status as QuoteStatus]
  const { subtotal, discountAmount, vatAmount, total } = calcTotal(items as any, quote.discount, vatRate, quote.include_vat)

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/q/${quote.public_token}`

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/dashboard/quotes/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowRight className="h-4 w-4" />
          חזרה לעריכה
        </Link>
        <div className="flex items-center gap-2">
          <CopyLinkButton url={publicUrl} />
          <Badge className={statusInfo.color}>{statusInfo.he}</Badge>
        </div>
      </div>

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
              <p className="text-gray-500 text-sm">
                בתוקף עד: {format(new Date(quote.valid_until), 'dd/MM/yyyy')}
              </p>
            )}
          </div>
          <div className="text-left">
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
                <span>הנחה ({quote.discount}%)</span>
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

        {/* Notes */}
        {quote.notes && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">הערות</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
