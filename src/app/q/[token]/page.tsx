import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency, calcTotal, STATUS_LABELS, intervalLabel, itemLineTotal } from '@/lib/utils'
import { format } from 'date-fns'
import PublicQuoteActions from '@/components/quotes/public-quote-actions'
import ReactMarkdown from 'react-markdown'

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
  const [itemsResult, profileResult, signatureResult, milestonesResult, attachmentsResult, sectionsResult] = await Promise.all([
    supabase.from('quote_items').select('*').eq('quote_id', quote.id).order('sort_order'),
    supabase.from('profiles').select('*').eq('id', quote.user_id).single(),
    supabase.from('signatures').select('*').eq('quote_id', quote.id).single(),
    supabase.from('payment_milestones').select('*').eq('quote_id', quote.id).order('sort_order'),
    supabase.from('quote_attachments').select('*').eq('quote_id', quote.id).order('sort_order'),
    supabase.from('quote_sections').select('*').eq('quote_id', quote.id).order('sort_order'),
  ])

  const items = itemsResult.data || []
  const profile = profileResult.data
  const signature = signatureResult.data
  const milestones = milestonesResult.data || []
  const attachments = attachmentsResult.data || []
  const sections = sectionsResult.data || []
  const vatRate = profile?.vat_rate ?? 18
  const currency = profile?.currency || 'ILS'
  const { subtotal, discountAmount, vatAmount, total } = calcTotal(items as any, quote.discount, vatRate, quote.include_vat, (quote as any).discount_type || 'percent')
  const showQuantity = (quote as any).show_quantity ?? false
  const isPending = ['sent', 'viewed'].includes(quote.status)
  const isAccepted = quote.status === 'accepted'
  const isDeclined = quote.status === 'declined'

  const oneTimeItems = items.filter((i: any) => !i.item_type || i.item_type === 'one_time')
  const recurringItems = items.filter((i: any) => i.item_type === 'recurring')
  const excludedItems = items.filter((i: any) => i.item_type === 'excluded')

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
                <p className="text-sm text-gray-500 mt-1">
                  בתוקף עד: {format(new Date(quote.valid_until), 'dd/MM/yyyy')}
                </p>
              )}
            </div>
            <div className="text-left flex flex-col items-end gap-1">
              {profile?.logo_url && (
                <img src={profile.logo_url} alt={profile?.business_name || ''} className="max-h-24 max-w-[200px] object-contain mb-2" />
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

          {/* Start sections */}
          {sections.filter((s: any) => s.position === 'start').length > 0 ? (
            <div className="flex flex-col gap-3 mb-8">
              {sections.filter((s: any) => s.position === 'start').map((sec: any) => (
                <div key={sec.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-4">
                  {sec.title && (
                    <div className="w-28 shrink-0 pt-0.5 border-l border-gray-200 pl-4">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{sec.title}</p>
                    </div>
                  )}
                  <div className="flex-1 text-sm text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-0.5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-0.5 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_p]:mb-1 [&_p:last-child]:mb-0">
                    <ReactMarkdown>{sec.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          ) : (quote as any).preamble ? (
            <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">על הפרויקט</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{(quote as any).preamble}</p>
            </div>
          ) : null}

          {/* Items — mobile: cards, desktop: table */}
          <div className="sm:hidden flex flex-col divide-y divide-gray-100 mb-6">
            {oneTimeItems.map((item: any, i: number) => (
              <div key={i} className="py-3.5 flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.description && <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">{item.description}</p>}
                  {item.discount_percent === 100 ? (
                    <p className="text-xs text-green-600 mt-1 font-medium">ללא עלות</p>
                  ) : showQuantity && item.quantity !== 1 ? (
                    <p className="text-xs text-gray-400 mt-1">{item.quantity} × {formatCurrency(item.unit_price, currency)}{item.discount_percent > 0 ? ` (${item.discount_percent}% הנחה)` : ''}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(item.unit_price, currency)}{item.discount_percent > 0 ? ` (${item.discount_percent}% הנחה)` : ''}</p>
                  )}
                </div>
                <p className="font-semibold text-gray-900 shrink-0">{formatCurrency(itemLineTotal(item as any), currency)}</p>
              </div>
            ))}
          </div>
          <table className="hidden sm:table w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-right py-3 font-semibold text-gray-700">פריט</th>
                {showQuantity && <th className="text-center py-3 font-semibold text-gray-700 w-20">כמות</th>}
                <th className="text-center py-3 font-semibold text-gray-700 w-28">מחיר יחידה</th>
                <th className="text-left py-3 font-semibold text-gray-700 w-28">סה&quot;כ</th>
              </tr>
            </thead>
            <tbody>
              {oneTimeItems.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3.5">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && <p className="text-gray-600 text-sm mt-0.5">{item.description}</p>}
                    {item.discount_percent === 100
                      ? <p className="text-xs text-green-600 mt-0.5 font-medium">ללא עלות</p>
                      : item.discount_percent > 0 && <p className="text-xs text-green-600 mt-0.5">הנחה {item.discount_percent}%</p>
                    }
                  </td>
                  {showQuantity && <td className="py-3.5 text-center text-gray-700">{item.quantity}</td>}
                  <td className="py-3.5 text-center text-gray-700">{formatCurrency(item.unit_price, currency)}</td>
                  <td className="py-3.5 text-left font-medium">{formatCurrency(itemLineTotal(item as any), currency)}</td>
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
                  <span>פטור ממע&quot;מ</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-gray-200 pt-3 font-black text-xl">
                <span>סה&quot;כ לתשלום</span>
                <span className="text-indigo-600">{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>

          {/* Recurring items */}
          {recurringItems.length > 0 && (
            <div className="mb-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">תשלומים חוזרים</p>
              <div className="sm:hidden flex flex-col divide-y divide-gray-100">
                {recurringItems.map((item: any, i: number) => (
                  <div key={i} className="py-3 flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.description && <p className="text-gray-600 text-sm mt-0.5">{item.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">{intervalLabel(item.recurring_interval)}</p>
                    </div>
                    <p className="font-semibold text-gray-900 shrink-0">{formatCurrency(itemLineTotal(item as any), currency)}</p>
                  </div>
                ))}
              </div>
              <table className="hidden sm:table w-full text-sm">
                <tbody>
                  {recurringItems.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && <p className="text-gray-600 text-sm mt-0.5">{item.description}</p>}
                      </td>
                      <td className="py-3 text-left text-gray-500 text-xs w-24">{intervalLabel(item.recurring_interval)}</td>
                      <td className="py-3 text-left font-medium w-28">{formatCurrency(itemLineTotal(item as any), currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Excluded items */}
          {excludedItems.length > 0 && (
            <div className="mb-6 pt-4 border-t border-dashed border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">אינו כלול בהצעה</p>
              <div className="flex flex-col gap-1.5">
                {excludedItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-500">
                    <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                    <div>
                      <span className="font-medium text-gray-700">{item.name}</span>
                      {item.description && <span className="text-gray-400"> — {item.description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment schedule */}
          {milestones.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">לוח תשלומים</p>
              <div className="flex flex-col gap-1.5">
                {milestones.map((m: any, i: number) => (
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

          {/* End sections */}
          {sections.filter((s: any) => s.position === 'end').length > 0 && (
            <div className="flex flex-col gap-4 mt-8">
              {sections.filter((s: any) => s.position === 'end').map((sec: any) => (
                <div key={sec.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {sec.title && <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{sec.title}</p>}
                  <div className="text-sm text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-0.5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-0.5 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_p]:mb-1 [&_p:last-child]:mb-0">
                    <ReactMarkdown>{sec.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="pt-6 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">הערות</p>
              <div className="text-sm text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-0.5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-0.5 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_p]:mb-1 [&_p:last-child]:mb-0">
                <ReactMarkdown>{quote.notes}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">מסמכים מצורפים</p>
              <div className="flex flex-col gap-2">
                {(attachments as any[]).map((att) => {
                  const isImage = att.file_type?.startsWith('image/')
                  return (
                    <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      {isImage
                        ? <img src={att.file_url} alt={att.file_name} className="h-9 w-9 object-cover rounded shrink-0" />
                        : <div className="h-9 w-9 bg-red-50 rounded flex items-center justify-center shrink-0"><span className="text-xs font-bold text-red-400">PDF</span></div>
                      }
                      <span className="text-sm text-gray-700 flex-1 truncate">{att.file_name}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Freelancer signature */}
          {(profile as any)?.freelancer_signature && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">חתימת הספק</p>
              <img src={(profile as any).freelancer_signature} alt="חתימה" className="max-h-16 max-w-[200px] object-contain" />
              <p className="text-sm font-medium text-gray-700 mt-1">{profile?.business_name}</p>
            </div>
          )}
        </div>

        {/* Actions / Signature */}
        {isPending && (
          <PublicQuoteActions quoteId={quote.id} />
        )}

        {/* Existing client signature */}
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
