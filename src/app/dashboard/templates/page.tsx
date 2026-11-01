import { createClient } from '@/lib/supabase/server'
import { Quote } from '@/lib/types'
import { duplicateQuote } from '@/app/actions/quote-actions'
import { createFromTemplate } from '@/app/actions/template-actions'
import { templates, calcTemplateSubtotal } from '@/lib/templates'
import { LayoutTemplate, Copy, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { t, getLang } from '@/lib/i18n'

function fmt(n: number) {
  return '₪' + n.toLocaleString('he-IL')
}

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [templatesResult, profileResult] = await Promise.all([
    supabase.from('quotes').select('*, client:clients(name)').eq('user_id', user.id).eq('is_template', true).is('deleted_at', null).order('updated_at', { ascending: false }),
    supabase.from('profiles').select('language').eq('id', user.id).single(),
  ])

  const myTemplates: Quote[] = templatesResult.data || []
  const lang = getLang(profileResult.data?.language || 'he')
  const T = t[lang]

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">{T.templates}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{T.templates_subtitle}</p>
      </div>

      {/* ── Section 1: My Templates ── */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{T.my_templates}</h2>

        {myTemplates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
            <LayoutTemplate className="h-9 w-9 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600 mb-1">{T.no_templates}</p>
            <p className="text-xs text-gray-400">{T.no_templates_desc1}</p>
            <p className="text-xs text-gray-400 mb-4">{T.no_templates_desc2}</p>
            <Link href="/dashboard/quotes">
              <Button variant="outline" className="text-xs">{T.go_to_quotes}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{template.title}</p>
                    {(template as any).client?.name && (
                      <p className="text-xs text-gray-400 mt-0.5">{T.template_base} {(template as any).client.name}</p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/quotes/${template.id}`}
                    className="p-1.5 text-gray-300 hover:text-indigo-500 transition-colors rounded-lg hover:bg-indigo-50 shrink-0"
                    title={T.edit}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </Link>
                </div>

                <form action={duplicateQuote.bind(null, template.id)} className="mt-auto">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {T.create_from_template}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: Ready-made Templates ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{T.ready_made_templates}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const subtotal = calcTemplateSubtotal(template)
            const minPrice = Math.min(...template.items.map(i => i.unit_price))
            return (
              <div key={template.slug} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-saffron/40 hover:shadow-sm transition-all">
                <div>
                  <span className="inline-block text-xs font-semibold text-saffron bg-saffron/10 rounded-full px-2.5 py-0.5 mb-2">
                    {template.industry[lang]}
                  </span>
                  <p className="font-semibold text-gray-900 leading-snug">{template.title[lang]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{template.subtitle[lang]}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{template.items.length} {T.items_label}</span>
                  <span className="font-mono font-medium text-gray-600">{T.from_label} {fmt(minPrice)}</span>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`/templates/${template.slug}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 text-xs font-medium px-3 py-2 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {T.preview}
                  </Link>
                  <form action={createFromTemplate.bind(null, template.slug)} className="flex-1">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-saffron hover:bg-saffron/90 text-obsidian text-xs font-semibold px-3 py-2 transition-colors"
                    >
                      {T.use_template}
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
