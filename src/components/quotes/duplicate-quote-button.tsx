'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { duplicateQuote } from '@/app/actions/quote-actions'

interface DuplicateQuoteButtonProps {
  quoteId: string
}

export default function DuplicateQuoteButton({ quoteId }: DuplicateQuoteButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      loading={isPending}
      onClick={() => startTransition(() => duplicateQuote(quoteId))}
    >
      <Copy className="h-4 w-4" />
      שכפל הצעה
    </Button>
  )
}
