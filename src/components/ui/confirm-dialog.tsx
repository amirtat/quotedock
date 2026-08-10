'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
}

const CLOSED: ConfirmState = { open: false, message: '', onConfirm: () => {} }

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(CLOSED)

  function openConfirm(opts: ConfirmOptions) {
    setState({ ...opts, open: true })
  }

  function handleConfirm() {
    state.onConfirm()
    setState(CLOSED)
  }

  function handleCancel() {
    setState(CLOSED)
  }

  const dialog = (
    <Dialog open={state.open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{state.title || 'אישור פעולה'}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mb-6">{state.message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {state.cancelLabel || 'ביטול'}
          </Button>
          <Button
            onClick={handleConfirm}
            className={state.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {state.confirmLabel || 'אישור'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return { dialog, openConfirm }
}
