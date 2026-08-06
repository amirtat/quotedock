'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteQuote } from '@/app/actions/quote-actions'

export default function DeleteQuoteButton({ quoteId }: { quoteId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('למחוק את ההצעה לצמיתות?')) return
    startTransition(() => deleteQuote(quoteId))
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      {isPending ? 'מוחק...' : 'מחק הצעה'}
    </button>
  )
}
