'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteQuote } from '@/app/actions/quote-actions'
import { useT } from '@/lib/lang-context'
import { useConfirm } from '@/components/ui/confirm-dialog'

export default function DeleteQuoteButton({ quoteId }: { quoteId: string }) {
  const T = useT()
  const [isPending, startTransition] = useTransition()
  const { dialog, openConfirm } = useConfirm()

  function handleDelete() {
    openConfirm({
      title: T.delete_quote_btn,
      message: T.confirm_delete_quote,
      confirmLabel: T.delete_quote_btn,
      cancelLabel: T.cancel,
      variant: 'danger',
      onConfirm: () => startTransition(() => deleteQuote(quoteId)),
    })
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {isPending ? T.deleting : T.delete_quote_btn}
      </button>
      {dialog}
    </>
  )
}
