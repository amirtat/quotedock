import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, formatCurrency, calcTotal, intervalLabel, itemLineTotal } from '@/lib/utils'
import { QuoteStatus } from '@/lib/types'
import { ArrowLeft, Edit, Copy } from 'lucide-react'
import { format } from 'date-fns'
import CopyLinkButton from '@/components/quotes/copy-link-button'
import DuplicateQuoteButton from '@/components/quotes/duplicate-quote-button'
import PrintButton from '@/components/quotes/print-button'
import DeleteQuoteButton from '@/components/quotes/delete-quote-button'
import TemplateToggleButton from '@/components/quotes/template-toggle-button'
import { Markdown } from '@/components/ui/markdown'
import { t, getLang } from '@/lib/i18n'

export default async function QuotePreviewPage({ params }: PageProps<'/dashboard/quotes/[id]/preview'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [quoteResult, itemsResult, profileResult, milestonesResult, attachmentsResult, sectionsResult] = await Promise.all([
    supabase.from('quotes').select('*, client:clients(*)').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('payment_milestones').select('*').eq('quote_id', id).order('sort_order'),
    supabase.from('quote_attachments').select('*').eq('quote_id', id).order('sort_order'),
    supabase.from('quote_sections').select('*').eq('quote_id', id).order('sort_order'),
  ])

  if (!quoteResult.data) notFound()

  const quote = quoteResult.data
  const items = itemsResult.data || []
  const profile = profileResult.data
  const milestones = milestonesResult.data || []
  const attachments = attachmentsResult.data || []
  const sections = sectionsResult.data || []
  const lang = getLang(profile?.language || 'he')
  const T = t[lang]
  const vatRate = profile?.vat_rate ?? 18
  const currency = profile?.currency || 'ILS'
  const statusInfo = STATUS_LABELS[quote.status as QuoteStatus]
  const { subtotal, discountAmount, vatAmount, total } = calcTotal(items as any, quote.discount, vatRate, quote.include_vat, (quote as any).discount_type || 'percent')
  const showQuantity = (quote as any).show_quantity ?? false

  const optionalItems = items.filter((i: any) => i.is_optional)
  const oneTimeItems = items.filter((i: any) => !i.is_optional && (!i.item_type || i.item_type === 'one_time'))
  const recurringItems = items.filter((i: any) => !i.is_optional && i.item_type === 'recurring')
  const excludedItems = items.filter((i: any) => i.item_type === 'excluded')

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/q/${quote.public_token}`

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Actions bar */}
      <div className="no-print flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
        <Link href={`/dashboard/quotes/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 me-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{T.back_to_edit}</span>
        </Link>
        <DeleteQuoteButton quoteId={id} />
        <div className="flex-1" />
        <Badge className={statusInfo.color}>{statusInfo[lang]}</Badge>
        <TemplateToggleButton quoteId={id} isTemplate={!!(quote as any).is_template} />
        <PrintButton />
        <DuplicateQuoteButton quoteId={id} />
        <CopyLinkButton url={publicUrl} />
      </div>

      {/* Quote document */}
      <div className="print-doc bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-8">
          <div className="flex flex-col items-end gap-1">
            {profile?.logo_url && (
              <img src={profile.logo_url} alt={profile.business_name || ''} className="max-h-16 max-w-[160px] object-contain mb-1" />
            )}
            <p className="font-bold text-gray-900 text-lg">{profile?.business_name}</p>
            {profile?.email && <p className="text-sm text-gray-500">{profile.email}</p>}
            {profile?.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
            {profile?.address && <p className="text-sm text-gray-500">{profile.address}</p>}
          </div>
          <div className="border-t border-gray-100 pt-4 sm:border-0 sm:pt-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{quote.title}</h1>
            <p className="text-gray-500 mt-1 font-mono text-sm">{quote.number}</p>
            <p className="text-gray-500 text-sm mt-0.5">
              {format(new Date(quote.created_at), 'dd/MM/yyyy')}
            </p>
            {quote.valid_until && (
              <p className="text-gray-500 text-sm">
                {T.valid_through}: {format(new Date(quote.valid_until), 'dd/MM/yyyy')}
              </p>
            )}
          </div>
        </div>

        {/* Client */}
        {(quote as any).client && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">{T.client}</p>
            <p className="font-medium text-gray-900">{(quote as any).client.name}</p>
            {(quote as any).client.company && <p className="text-sm text-gray-600">{(quote as any).client.company}</p>}
            {(quote as any).client.email && <p className="text-sm text-gray-500">{(quote as any).client.email}</p>}
          </div>
        )}

        {/* Start sections */}
        {sections.filter((s: any) => s.position === 'start').length > 0 ? (
          <div className="flex flex-col gap-3 mb-8">
            {sections.filter((s: any) => s.position === 'start').map((sec: any) => (
              <div key={sec.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
                {sec.title && (
                  <div className="shrink-0 pt-0.5 border-b border-gray-200 pb-2 sm:border-b-0 sm:pb-0 sm:w-28 sm:border-l sm:border-gray-200 sm:pl-4">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{sec.title}</p>
                  </div>
                )}
                <div className="flex-1"><Markdown>{sec.content}</Markdown></div>
              </div>
            ))}
          </div>
        ) : (quote as any).preamble ? (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{T.about_project}</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{(quote as any).preamble}</p>
          </div>
        ) : null}

        {/* Items header */}
        {profile?.quote_items_header && sections.filter((s: any) => s.position === 'start').length > 0 && (
          <h2 className="text-base font-semibold text-gray-800 mb-4 -mt-2">{profile.quote_items_header}</h2>
        )}

        {/* Items — mobile: cards, desktop: table */}
        <div className="sm:hidden flex flex-col divide-y divide-gray-100 mb-6">
          {oneTimeItems.map((item: any, i: number) => (
            <div key={i} className="py-3.5 flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{item.name}</p>
                {item.description && <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">{item.description}</p>}
                {item.discount_percent === 100 ? (
                  <p className="text-xs text-green-600 mt-1 font-medium">{T.free}</p>
                ) : showQuantity && item.quantity !== 1 ? (
                  <p className="text-xs text-gray-400 mt-1">{item.quantity} × {formatCurrency(item.unit_price, currency)}{item.discount_percent > 0 ? ` (${item.discount_percent}% ${T.discount})` : ''}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">{formatCurrency(item.unit_price, currency)}{item.discount_percent > 0 ? ` (${item.discount_percent}% ${T.discount})` : ''}</p>
                )}
              </div>
              <p className="font-semibold text-gray-900 shrink-0">{formatCurrency(itemLineTotal(item as any), currency)}</p>
            </div>
          ))}
        </div>
        <table className="hidden sm:table w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-right py-2 font-semibold text-gray-700">{T.item_col}</th>
              {showQuantity && <th className="text-center py-2 font-semibold text-gray-700">{T.quantity}</th>}
              <th className="text-center py-2 font-semibold text-gray-700">{T.unit_price}</th>
              <th className="text-left py-2 font-semibold text-gray-700">{T.total}</th>
            </tr>
          </thead>
          <tbody>
            {oneTimeItems.map((item: any, i: number) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.description && <p className="text-gray-600 text-sm mt-0.5">{item.description}</p>}
                  {item.discount_percent === 100
                    ? <p className="text-xs text-green-600 mt-0.5 font-medium">{T.free}</p>
                    : item.discount_percent > 0 && <p className="text-xs text-green-600 mt-0.5">{T.discount} {item.discount_percent}%</p>
                  }
                </td>
                {showQuantity && <td className="py-3 text-center text-gray-700">{item.quantity}</td>}
                <td className="py-3 text-center text-gray-700">{formatCurrency(item.unit_price, currency)}</td>
                <td className="py-3 text-left font-medium">{formatCurrency(itemLineTotal(item as any), currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-60 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{T.subtotal}</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>
                  {(quote as any).discount_reason ? `${T.discount} — ${(quote as any).discount_reason}` : T.discount}
                  {(quote as any).discount_type !== 'fixed' && ` (${quote.discount}%)`}
                </span>
                <span>-{formatCurrency(discountAmount, currency)}</span>
              </div>
            )}
            {quote.include_vat && vatRate > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{T.vat} ({vatRate}%)</span>
                <span>{formatCurrency(vatAmount, currency)}</span>
              </div>
            )}
            {vatRate === 0 && (
              <div className="flex justify-between text-gray-500 text-xs">
                <span>{T.vat_exempt}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-gray-200 pt-2 font-black text-xl">
              <span>{T.grand_total}</span>
              <span className="text-indigo-600">{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Recurring items */}
        {recurringItems.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{T.recurring_items}</p>
            <div className="sm:hidden flex flex-col divide-y divide-gray-100">
              {recurringItems.map((item: any, i: number) => (
                <div key={i} className="py-3 flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && <p className="text-gray-600 text-sm mt-0.5">{item.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">{intervalLabel(item.recurring_interval, lang)}</p>
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
                    <td className="py-3 text-left text-gray-500 text-xs w-24">{intervalLabel(item.recurring_interval, lang)}</td>
                    <td className="py-3 text-left font-medium w-28">{formatCurrency(itemLineTotal(item as any), currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Optional items */}
        {optionalItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-dashed border-amber-200">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">{T.optional_items}</p>
            <div className="flex flex-col gap-2">
              {optionalItems.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-start p-3 rounded-lg border border-amber-100 bg-amber-50/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">{T.optional}</span>
                    </div>
                    {item.description && <p className="text-gray-600 text-sm mt-0.5">{item.description}</p>}
                    {item.item_type === 'recurring' && item.recurring_interval && (
                      <p className="text-xs text-gray-400 mt-0.5">{intervalLabel(item.recurring_interval, lang)}</p>
                    )}
                  </div>
                  <p className="font-medium text-gray-700 shrink-0 text-left">{formatCurrency(itemLineTotal(item as any), currency)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment schedule */}
        {milestones.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">{T.payment_schedule}</p>
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

        {/* Excluded items */}
        {excludedItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{T.excluded}</p>
            <div className="flex flex-col gap-1.5">
              {excludedItems.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-500">
                  <span className="text-gray-300 mt-0.5 shrink-0">·</span>
                  <div>
                    <span className="font-medium text-gray-700">{item.name}</span>
                    {item.description && <span className="text-gray-400"> — {item.description}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* End sections */}
        {sections.filter((s: any) => s.position === 'end').length > 0 && (
          <div className="flex flex-col gap-3 mt-8">
            {sections.filter((s: any) => s.position === 'end').map((sec: any) => (
              <div key={sec.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
                {sec.title && (
                  <div className="shrink-0 pt-0.5 border-b border-gray-200 pb-2 sm:border-b-0 sm:pb-0 sm:w-28 sm:border-l sm:border-gray-200 sm:pl-4">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{sec.title}</p>
                  </div>
                )}
                <div className="flex-1"><Markdown>{sec.content}</Markdown></div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">{T.notes}</p>
            <Markdown>{quote.notes}</Markdown>
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">{T.attachments}</p>
            <div className="flex flex-col gap-2">
              {attachments.map((att: any) => {
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
            <p className="text-xs text-gray-400 mb-2">{T.provider_signature}</p>
            <img src={(profile as any).freelancer_signature} alt={T.signature_label} className="max-h-16 max-w-[200px] object-contain" />
            <p className="text-sm font-medium text-gray-700 mt-1">{profile?.business_name}</p>
          </div>
        )}
      </div>

      {/* Status timeline — freelancer only, not printed */}
      <div className="no-print mt-4 bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-medium text-gray-500 uppercase mb-3">{T.timeline}</p>
        <div className="flex flex-col gap-2">
          {[
              { label: T.created, ts: quote.created_at },
              { label: T.sent_status, ts: quote.sent_at },
              { label: T.viewed_status, ts: quote.viewed_at },
              { label: T.accepted_status, ts: quote.accepted_at },
              { label: T.declined_status, ts: quote.declined_at },
            ]
              .filter((e) => e.ts)
              .map((e) => (
                <div key={e.label} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-gray-500 shrink-0">{e.label}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                  <span className="text-gray-700 font-mono text-xs">
                    {format(new Date(e.ts!), 'dd/MM/yyyy HH:mm')}
                  </span>
                  {e.label === T.viewed_status && quote.sent_at && (
                    <span className="text-xs text-gray-400">
                      ({Math.round((new Date(e.ts!).getTime() - new Date(quote.sent_at).getTime()) / 3600000)} {T.hours_from_send})
                    </span>
                  )}
                  {(e.label === T.accepted_status || e.label === T.declined_status) && quote.sent_at && (
                    <span className="text-xs text-gray-400">
                      ({Math.round((new Date(e.ts!).getTime() - new Date(quote.sent_at).getTime()) / 86400000)} {T.days_from_send})
                    </span>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}
