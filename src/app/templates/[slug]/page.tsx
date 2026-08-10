import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getTemplate, calcTemplateSubtotal } from '@/lib/templates'
import { createFromTemplate } from '@/app/actions/template-actions'
import { createClient } from '@/lib/supabase/server'
import type { Lang } from '@/lib/i18n'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

const DEMO_VAT_RATE = 18

const copy = {
  he: {
    back: 'כל התבניות',
    items_col: 'שירות / פריט',
    qty_col: 'כמות',
    price_col: 'מחיר יחידה',
    total_col: 'סה"כ',
    subtotal: 'סכום ביניים',
    vat: 'מע"מ',
    grand_total: 'סה"כ לתשלום',
    notes: 'הערות',
    use_template: 'השתמש בתבנית',
    use_template_sub: 'בחר תבנית זו וצור הצעה מוכנה תוך שניות',
    signup_cta: 'הרשמה בחינם',
    login_cta: 'כניסה לחשבון',
    already_account: 'כבר יש חשבון?',
    arrow: ArrowLeft,
    dir: 'rtl' as const,
  },
  en: {
    back: 'All templates',
    items_col: 'Service / Item',
    qty_col: 'Qty',
    price_col: 'Unit price',
    total_col: 'Total',
    subtotal: 'Subtotal',
    vat: 'VAT',
    grand_total: 'Grand total',
    notes: 'Notes',
    use_template: 'Use this template',
    use_template_sub: 'Pick this template and get a ready-made quote in seconds',
    signup_cta: 'Sign up free',
    login_cta: 'Sign in',
    already_account: 'Already have an account?',
    arrow: ArrowRight,
    dir: 'ltr' as const,
  },
}

function fmt(n: number) {
  return '₪' + n.toLocaleString('he-IL', { minimumFractionDigits: 2 })
}

export default async function TemplatePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const template = getTemplate(slug)
  if (!template) notFound()

  const cookieStore = await cookies()
  const lang: Lang = cookieStore.get('qdl')?.value === 'en' ? 'en' : 'he'
  const C = copy[lang]
  const Arrow = C.arrow

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const subtotal = calcTemplateSubtotal(template)
  const vatAmount = template.include_vat ? subtotal * (DEMO_VAT_RATE / 100) : 0
  const total = subtotal + vatAmount

  return (
    <div className="min-h-screen bg-gray-50" dir={C.dir}>
      {/* Nav */}
      <nav className="bg-obsidian px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/brand/mark-primary-inverse.svg" alt="" width={28} height={28} />
          <span className="text-white font-bold text-[15px] tracking-tight">QuoteDock</span>
        </div>
        <Link
          href="/templates"
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors"
        >
          <Arrow className="h-3.5 w-3.5" />
          {C.back}
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Industry badge + title */}
        <div className="mb-6">
          <span className="inline-block text-xs font-semibold text-saffron bg-saffron/10 rounded-full px-3 py-1 mb-3">
            {template.industry[lang]}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{template.title[lang]}</h1>
          <p className="text-gray-500 text-sm mt-1">{template.subtitle[lang]}</p>
        </div>

        {/* Quote preview */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-8 mb-6">
          {/* Items - mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-gray-100 mb-6">
            {template.items.map((item, i) => (
              <div key={i} className="py-3.5 flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{item.name[lang]}</p>
                  {item.description[lang] && (
                    <p className="text-gray-500 text-sm mt-0.5">{item.description[lang]}</p>
                  )}
                  {item.quantity !== 1 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {item.quantity} x {fmt(item.unit_price)}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-gray-900 shrink-0">{fmt(item.unit_price * item.quantity)}</p>
              </div>
            ))}
          </div>

          {/* Items - desktop table */}
          <table className="hidden sm:table w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-right py-3 font-semibold text-gray-700">{C.items_col}</th>
                <th className="text-center py-3 font-semibold text-gray-700 w-16">{C.qty_col}</th>
                <th className="text-center py-3 font-semibold text-gray-700 w-28">{C.price_col}</th>
                <th className="text-left py-3 font-semibold text-gray-700 w-28">{C.total_col}</th>
              </tr>
            </thead>
            <tbody>
              {template.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3.5">
                    <p className="font-medium text-gray-900">{item.name[lang]}</p>
                    {item.description[lang] && (
                      <p className="text-gray-500 text-sm mt-0.5">{item.description[lang]}</p>
                    )}
                  </td>
                  <td className="py-3.5 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3.5 text-center text-gray-600">{fmt(item.unit_price)}</td>
                  <td className="py-3.5 text-left font-medium">{fmt(item.unit_price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{C.subtotal}</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {template.include_vat && (
                <div className="flex justify-between text-gray-600">
                  <span>{C.vat} ({DEMO_VAT_RATE}%)</span>
                  <span>{fmt(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-gray-200 pt-3 font-black text-xl">
                <span>{C.grand_total}</span>
                <span className="text-indigo-600">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {template.notes[lang] && (
            <div className="pt-6 border-t border-gray-100 mt-6">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">{C.notes}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{template.notes[lang]}</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-saffron" />
            <h2 className="font-bold text-gray-900 text-lg">{C.use_template}</h2>
          </div>
          <p className="text-gray-500 text-sm mb-6">{C.use_template_sub}</p>

          {user ? (
            <form action={createFromTemplate.bind(null, slug)}>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-saffron hover:bg-saffron/90 text-obsidian font-semibold px-6 py-3 text-sm transition-colors"
              >
                {C.use_template}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Link
                href={`/auth/signup?redirect=/templates/${slug}`}
                className="inline-flex items-center justify-center rounded-xl bg-saffron hover:bg-saffron/90 text-obsidian font-semibold px-6 py-3 text-sm transition-colors"
              >
                {C.signup_cta}
              </Link>
              <p className="text-xs text-gray-400">
                {C.already_account}{' '}
                <Link href={`/auth/login?redirect=/templates/${slug}`} className="text-indigo-600 hover:underline">
                  {C.login_cta}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 pb-8">
        Powered by{' '}
        <a href="http://www.tripleai.co.il" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-gray-600 transition-colors">
          TripleA.I
        </a>
      </footer>
    </div>
  )
}
