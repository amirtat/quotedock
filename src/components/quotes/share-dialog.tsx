'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Copy, Mail } from 'lucide-react'

interface ShareDialogProps {
  open: boolean
  quoteId: string
  quoteUrl: string
  quoteTitle: string
  clientName?: string
  clientEmail?: string
  onClose: () => void
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function ShareDialog({ open, quoteId, quoteUrl, quoteTitle, clientName, clientEmail, onClose }: ShareDialogProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const firstName = clientName?.split(' ')[0] || ''
  const defaultMessage = [
    firstName ? `היי ${firstName},` : 'היי,',
    '',
    'שמח לשלוח לכם את הצעת המחיר לפרויקט.',
    'הפרויקט מעניין אותי מאוד, ואשמח לקחת בו חלק ולהפוך את הרעיון לפתרון מלא, חכם ואוטומטי.',
    '',
    'הצעת המחיר זמינה כאן:',
    quoteUrl,
    'להצעה מצורפים שני מסמכים:',
    'דוח אפיון מפורט כולל התהליך המלא, הסטאק הטכנולוגי המוצע ותחזית העלויות',
    'תרשים זרימה ויזואלי של המערכת',
    '',
    'אשלח גם בוואטסאפ הודעה עם קצת רקע על ההצעה ועל שיתוף הפעולה שאני מציע.',
    '',
    'אמיר טטרסקי',
    'TripleA.I',
    '052-3450000',
  ].join('\n')

  const [message, setMessage] = useState(defaultMessage)

  function handleCopy() {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  function handleEmail() {
    const subject = encodeURIComponent(`הצעת מחיר — ${quoteTitle}`)
    const body = encodeURIComponent(message)
    const to = clientEmail || ''
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank')
  }

  function handleDone() {
    onClose()
    router.push(`/dashboard/quotes/${quoteId}/preview`)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDone() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>שתף את ההצעה</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Message editor */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-gray-500">הודעה לשליחה</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={13}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 leading-relaxed resize-none focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
              dir="rtl"
            />
          </div>

          {/* Share buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-3 text-sm transition-colors"
            >
              <WhatsAppIcon />
              שלח בווטסאפ
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 text-sm transition-colors"
            >
              <Mail className="h-4 w-4" />
              שלח במייל
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 text-sm transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'הועתק!' : 'העתק הודעה'}
            </button>
          </div>

          <button
            onClick={handleDone}
            className="text-sm text-gray-400 hover:text-gray-600 text-center transition-colors"
          >
            סגור ועבור להצעה
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
