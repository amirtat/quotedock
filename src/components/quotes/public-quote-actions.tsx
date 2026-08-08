'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { t, getLang } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'

function SignaturePad({ onChange, T }: { onChange: (dataUrl: string | null) => void; T: typeof t.he | typeof t.en }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const empty = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const src = 'touches' in e ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (empty.current) {
      empty.current = false
      onChange(canvas.toDataURL())
    } else {
      onChange(canvas.toDataURL())
    }
  }

  function stopDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = false
  }

  function clear() {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    empty.current = true
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label>{T.signature_label} *</Label>
        <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <RotateCcw className="h-3 w-3" />
          {T.clear_signature}
        </button>
      </div>
      <div className="relative border border-gray-200 rounded-xl bg-gray-50 overflow-hidden" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 pointer-events-none select-none" style={{ display: empty.current ? undefined : 'none' }}>
          {T.sign_here}
        </p>
      </div>
    </div>
  )
}

export default function PublicQuoteActions({ quoteId, lang = 'he' }: { quoteId: string; lang?: Lang }) {
  const T = t[getLang(lang)]
  const [step, setStep] = useState<'idle' | 'signing'>('idle')
  const [action, setAction] = useState<'accepted' | 'declined' | null>(null)
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleDecline() {
    setAction('declined')
    setSaving(true)
    const supabase = createClient()
    await supabase.from('quotes').update({ status: 'declined', declined_at: new Date().toISOString() }).eq('id', quoteId)
    window.location.reload()
  }

  async function handleAccept() {
    if (!signerName.trim()) return setError(T.error_full_name)
    if (!signatureData) return setError(T.error_signature)
    setError('')
    setSaving(true)
    const supabase = createClient()

    await supabase.from('quotes').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', quoteId)
    await supabase.from('signatures').insert({
      quote_id: quoteId,
      signer_name: signerName,
      signer_email: signerEmail || null,
      signature_data: signatureData,
    })

    window.location.reload()
  }

  if (step === 'idle') {
    return (
      <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-medium text-gray-900">{T.what_do_you_think}</p>
          <p className="text-sm text-gray-500 mt-0.5">{T.accept_or_decline}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDecline}
            loading={saving && action === 'declined'}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            {T.decline_quote}
          </Button>
          <Button
            onClick={() => { setStep('signing'); setAction('accepted') }}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            {T.accept_quote}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 bg-white rounded-2xl border border-indigo-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{T.confirm_quote_title}</h3>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{T.signer_name} *</Label>
          <Input
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder={lang === 'he' ? 'ישראל ישראלי' : 'John Smith'}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{T.optional_email}</Label>
          <Input
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="email@example.com"
            dir="ltr"
          />
        </div>
        <SignaturePad onChange={setSignatureData} T={T} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => setStep('idle')}>{T.cancel}</Button>
          <Button onClick={handleAccept} loading={saving} className="flex-1 bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4" />
            {T.i_confirm_quote}
          </Button>
        </div>
      </div>
    </div>
  )
}
