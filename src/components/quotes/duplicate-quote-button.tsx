'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { duplicateQuote } from '@/app/actions/quote-actions'
import { useT } from '@/lib/lang-context'

interface DuplicateQuoteButtonProps {
  quoteId: string
}

export default function DuplicateQuoteButton({ quoteId }: DuplicateQuoteButtonProps) {
  const T = useT()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDuplicate() {
    setError(null)
    startTransition(async () => {
      try {
        await duplicateQuote(quoteId)
      } catch (e: any) {
        // redirect() throws a special Next.js error — let it through
        if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e
        setError(T.duplicate_error)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" loading={isPending} onClick={handleDuplicate}>
        <Copy className="h-4 w-4" />
        {T.duplicate_quote_btn}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
