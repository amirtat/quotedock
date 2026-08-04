'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle } from 'lucide-react'

export default function PublicQuoteActions({ quoteId }: { quoteId: string }) {
  const [step, setStep] = useState<'idle' | 'signing' | 'done'>('idle')
  const [action, setAction] = useState<'accepted' | 'declined' | null>(null)
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleDecline() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('quotes').update({ status: 'declined', declined_at: new Date().toISOString() }).eq('id', quoteId)
    window.location.reload()
  }

  async function handleAccept() {
    if (!signerName.trim()) return
    setSaving(true)
    const supabase = createClient()

    await supabase.from('quotes').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', quoteId)
    await supabase.from('signatures').insert({
      quote_id: quoteId,
      signer_name: signerName,
      signer_email: signerEmail || null,
      signature_data: `text:${signerName}`,
    })

    window.location.reload()
  }

  if (step === 'idle') {
    return (
      <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-medium text-gray-900">מה דעתך על ההצעה?</p>
          <p className="text-sm text-gray-500 mt-0.5">אשר או דחה את ההצעה</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => { setAction('declined'); handleDecline() }}
            loading={saving && action === 'declined'}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            דחה הצעה
          </Button>
          <Button
            onClick={() => { setStep('signing'); setAction('accepted') }}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            אשר הצעה
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 bg-white rounded-2xl border border-indigo-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">אישור הצעת מחיר</h3>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>שם מלא *</Label>
          <Input
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="ישראל ישראלי"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>אימייל (אופציונלי)</Label>
          <Input
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="email@example.com"
            dir="ltr"
          />
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => setStep('idle')}>ביטול</Button>
          <Button onClick={handleAccept} loading={saving} className="flex-1 bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4" />
            אני מאשר/ת את ההצעה
          </Button>
        </div>
      </div>
    </div>
  )
}
