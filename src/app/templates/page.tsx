import Link from 'next/link'
import { cookies } from 'next/headers'
import { templates, calcTemplateSubtotal } from '@/lib/templates'
import { createClient } from '@/lib/supabase/server'
import type { Lang } from '@/lib/i18n'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const copy = {
  he: {
    back_guest: 'חזרה לדף הבית',
    back_user: 'התבניות שלי',
    title: 'תבניות מוכנות',
    subtitle: 'בחר תבנית לתעשייה שלך, הוסף את הפרטים שלך, ושלח. ניתן לשנות הכל.',
    items_label: 'פריטים',
    from_label: 'החל מ',
    preview: 'צפה בתבנית',
    arrow: ArrowLeft,
  },
  en: {
    back_guest: 'Back to homepage',
    back_user: 'My templates',
    title: 'Ready-made templates',
    subtitle: 'Pick a template for your industry, add your details, and send. Everything is editable.',
    items_label: 'items',
    from_label: 'From',
    preview: 'Preview template',
    arrow: ArrowRight,
  },
}

function fmt(n: number) {
  return '₪' + n.toLocaleString('he-IL')
}

export default async function TemplatesPage() {
  const cookieStore = await cookies()
  const lang: Lang = cookieStore.get('qdl')?.value === 'en' ? 'en' : 'he'
  const C = copy[lang]
  const dir = lang === 'he' ? 'rtl' : 'ltr'
  const Arrow = C.arrow

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const backHref = user ? '/dashboard/templates' : '/'
  const backLabel = user ? C.back_user : C.back_guest

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      {/* Nav */}
      <nav className="bg-obsidian px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/brand/mark-primary-inverse.svg" alt="" width={28} height={28} />
          <span className="text-white font-bold text-[15px] tracking-tight">QuoteDock</span>
        </div>
        <Link href={backHref} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
          <Arrow className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      </nav>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{C.title}</h1>
        <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto">{C.subtitle}</p>
      </div>

      {/* Template cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => {
            const subtotal = calcTemplateSubtotal(template)
            return (
              <Link
                key={template.slug}
                href={`/templates/${template.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-saffron/40 hover:shadow-md transition-all"
              >
                <div className="mb-4">
                  <span className="inline-block text-xs font-semibold text-saffron bg-saffron/10 rounded-full px-3 py-1 mb-3">
                    {template.industry[lang]}
                  </span>
                  <h2 className="font-bold text-gray-900 text-base leading-snug group-hover:text-saffron transition-colors">
                    {template.title[lang]}
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">{template.subtitle[lang]}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>{template.items.length} {C.items_label}</span>
                  <span className="font-mono font-medium text-gray-700">{C.from_label} {fmt(Math.min(...template.items.map(i => i.unit_price)))}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-saffron group-hover:underline">{C.preview}</span>
                  <Arrow className="h-4 w-4 text-saffron opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            )
          })}
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
