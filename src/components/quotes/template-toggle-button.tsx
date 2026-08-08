'use client'

import { useState, useTransition, useEffect } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { toggleTemplate } from '@/app/actions/quote-actions'
import { useRouter } from 'next/navigation'
import { useT } from '@/lib/lang-context'

export default function TemplateToggleButton({ quoteId, isTemplate }: { quoteId: string; isTemplate: boolean }) {
  const T = useT()
  const [isPending, startTransition] = useTransition()
  const [current, setCurrent] = useState(isTemplate)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => { setCurrent(isTemplate) }, [isTemplate])

  function handleToggle() {
    const next = !current
    setCurrent(next)
    setError(null)
    startTransition(async () => {
      try {
        await toggleTemplate(quoteId, next)
      } catch (err: any) {
        setCurrent(!next)
        setError(err?.message || T.template_save_error)
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleToggle}
        disabled={isPending}
        title={current ? T.remove_from_templates : T.save_as_template}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
          current
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            : 'text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
        }`}
      >
        <LayoutTemplate className="h-4 w-4 shrink-0" />
        {current ? T.template_saved : T.save_as_template}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
