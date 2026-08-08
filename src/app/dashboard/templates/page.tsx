import { createClient } from '@/lib/supabase/server'
import { Quote } from '@/lib/types'
import { duplicateQuote } from '@/app/actions/quote-actions'
import { LayoutTemplate, Plus, Copy } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { t, getLang } from '@/lib/i18n'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [templatesResult, profileResult] = await Promise.all([
    supabase.from('quotes').select('*, client:clients(name)').eq('user_id', user.id).eq('is_template', true).order('updated_at', { ascending: false }),
    supabase.from('profiles').select('language').eq('id', user.id).single(),
  ])

  const allTemplates: Quote[] = templatesResult.data || []
  const lang = getLang(profileResult.data?.language || 'he')
  const T = t[lang]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{T.templates}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{T.templates_subtitle}</p>
        </div>
      </div>

      {allTemplates.length === 0 ? (
        <div className="text-center py-20">
          <LayoutTemplate className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-700 mb-2">{T.no_templates}</h2>
          <p className="text-gray-500 text-sm mb-1">{T.no_templates_desc1}</p>
          <p className="text-gray-500 text-sm mb-6">{T.no_templates_desc2}</p>
          <Link href="/dashboard/quotes">
            <Button variant="outline">{T.go_to_quotes}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTemplates.map((template) => (
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
    </div>
  )
}
