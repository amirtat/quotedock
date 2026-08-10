'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

const copy = {
  he: {
    demo_label: 'זהו דמו בלבד',
    demo_sub: 'אפשר לנסות את חוויית הלקוח - שום דבר לא נשמר',
    signup_cta: 'צור חשבון בחינם ←',
    quote_title: 'פיתוח אפליקציית מובייל',
    valid_until: 'בתוקף עד: 31/08/2025',
    quote_for: 'הצעה עבור',
    about_project: 'על הפרויקט',
    preamble: 'פיתוח אפליקציית מובייל מלאה עבור StartupXYZ, כולל אפיון, עיצוב ופיתוח ל-iOS ו-Android. האפליקציה תכלול אינטגרציה ל-API הקיים, ממשק RTL מלא ותמיכה בשפה העברית.',
    col_item: 'פריט',
    col_price: 'מחיר יחידה',
    col_total: 'סכום',
    subtotal: 'סכום ביניים',
    vat: 'מע"מ (18%)',
    grand_total: 'סה"כ',
    payment_schedule: 'לוח תשלומים',
    notes_label: 'הערות',
    notes: 'ההצעה כוללת שני סבבי תיקונים לכל שלב. שינויים מעבר לכך יחויבו בנפרד. הנ"ל אינו כולל תשתית ענן/שרתים. זמן פיתוח משוער: 12–14 שבועות.',
    what_do_you_think: 'מה דעתך על ההצעה?',
    action_sub: 'תוכל לאשר, לחתום ולשלוח בחזרה - הכל כאן',
    decline: 'דחייה',
    accept: 'אישור ההצעה',
    decline_alert: 'בדמו זה לא עובד - אבל בחשבון אמיתי הלקוח יקבל הודעת דחייה',
    declined_title: 'הדמו - ההצעה נדחתה',
    declined_body: 'בחשבון אמיתי, הספק יקבל התראה ומצב ההצעה ישתנה ל"נדחתה".',
    declined_reset: 'אפס דמו',
    sign_title: 'אישור וחתימה',
    full_name: 'שם מלא *',
    name_placeholder: 'ישראל ישראלי',
    signature_label: 'חתימה *',
    clear: 'נקה',
    sign_here: 'חתום כאן',
    sig_demo_note: 'בדמו זה לא ניתן לחתום - אבל בחשבון אמיתי יהיה כאן לוח חתימה',
    error_name: 'נא להזין שם מלא',
    back: 'חזרה',
    confirm: 'אני מאשר/ת את ההצעה',
    done_title: 'הצעה אושרה! (דמו)',
    done_sub: 'בחשבון אמיתי - הפרילנסר היה מקבל עדכון בזמן אמת עם החתימה שלך',
    items: [
      { name: 'אפיון UX ומסעות משתמש', description: 'ראיונות משתמש, wireframes ומפרט מפורט', price: 4500 },
      { name: 'עיצוב UI - מסכים מלאים', description: 'כל מסכי האפליקציה ב-Figma, כולל responsive', price: 6000 },
      { name: 'פיתוח React Native', description: 'iOS + Android, אינטגרציה ל-API קיים', price: 18000 },
      { name: 'בדיקות QA ועלייה לאוויר', description: 'בדיקות מלאות ופרסום ל-App Store ו-Google Play', price: 3500 },
    ],
    milestones: [
      { title: 'מקדמה - תחילת עבודה', pct: 40, date: '01/08/2025' },
      { title: 'אבן דרך - אישור עיצובים', pct: 30, date: '01/09/2025' },
      { title: 'יתרה - מסירה סופית', pct: 30, date: '01/10/2025' },
    ],
    client_name: 'מיקאל כהן',
    client_company: 'StartupXYZ',
  },
  en: {
    demo_label: 'This is a demo only',
    demo_sub: 'Try the client experience - nothing is saved',
    signup_cta: 'Create free account →',
    quote_title: 'Mobile App Development',
    valid_until: 'Valid until: 31/08/2025',
    quote_for: 'Quote for',
    about_project: 'About the project',
    preamble: 'Full mobile app development for StartupXYZ, including UX research, design, and development for iOS and Android. The app will integrate with the existing API and include full RTL Hebrew support.',
    col_item: 'Item',
    col_price: 'Unit price',
    col_total: 'Total',
    subtotal: 'Subtotal',
    vat: 'VAT (18%)',
    grand_total: 'Total',
    payment_schedule: 'Payment schedule',
    notes_label: 'Notes',
    notes: 'Quote includes two revision rounds per phase. Additional changes will be billed separately. Cloud/server infrastructure is not included. Estimated development time: 12–14 weeks.',
    what_do_you_think: 'What do you think of this quote?',
    action_sub: 'You can approve, sign, and send back - all right here',
    decline: 'Decline',
    accept: 'Approve quote',
    decline_alert: 'This is a demo - in a real account the client would receive a decline notification',
    sign_title: 'Approval & Signature',
    full_name: 'Full name *',
    name_placeholder: 'John Smith',
    signature_label: 'Signature *',
    clear: 'Clear',
    sign_here: 'Sign here',
    sig_demo_note: 'Signing is disabled in demo - a real account includes a full signature pad',
    error_name: 'Please enter your full name',
    back: 'Back',
    confirm: 'I approve this quote',
    done_title: 'Quote approved! (demo)',
    done_sub: 'In a real account - the freelancer would receive a real-time notification with your signature',
    items: [
      { name: 'UX Research & User Journeys', description: 'User interviews, wireframes, and full spec', price: 4500 },
      { name: 'UI Design - Full Screens', description: 'All app screens in Figma, including responsive', price: 6000 },
      { name: 'React Native Development', description: 'iOS + Android, integration with existing API', price: 18000 },
      { name: 'QA Testing & Launch', description: 'Full testing and App Store / Google Play release', price: 3500 },
    ],
    milestones: [
      { title: 'Upfront - project kickoff', pct: 40, date: '01/08/2025' },
      { title: 'Milestone - design approval', pct: 30, date: '01/09/2025' },
      { title: 'Balance - final delivery', pct: 30, date: '01/10/2025' },
    ],
    client_name: 'Michal Cohen',
    client_company: 'StartupXYZ',
  },
}

function fmt(n: number) {
  return '₪' + n.toLocaleString('he-IL')
}

export default function DemoQuotePage() {
  const lang = useLang()
  const C = copy[lang]
  const dir = lang === 'he' ? 'rtl' : 'ltr'

  const subtotal = C.items.reduce((s, i) => s + i.price, 0)
  const vat = Math.round(subtotal * 0.18)
  const total = subtotal + vat

  const [step, setStep] = useState<'idle' | 'signing' | 'done' | 'declined'>('idle')
  const [signerName, setSignerName] = useState('')
  const [error, setError] = useState('')

  function handleAccept() {
    if (!signerName.trim()) { setError(C.error_name); return }
    setStep('done')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Demo banner */}
        <div className="mb-5 rounded-xl bg-saffron-50 border border-saffron-100 px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-saffron text-sm">{C.demo_label}</p>
            <p className="text-saffron/70 text-xs mt-0.5">{C.demo_sub}</p>
          </div>
          <Link
            href="/auth/signup"
            className="bg-saffron hover:bg-saffron-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            {C.signup_cta}
          </Link>
        </div>

        {/* Quote document */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8" dir={dir}>

          {/* Header */}
          <div className="flex justify-between items-start mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{C.quote_title}</h1>
              <p className="text-gray-400 mt-1 font-mono text-sm">QD-2025-042</p>
              <p className="text-gray-400 text-sm mt-0.5">01/08/2025</p>
              <p className="text-sm text-gray-400 mt-1">{C.valid_until}</p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <div className="w-12 h-12 rounded-xl bg-saffron/10 flex items-center justify-center mb-1">
                <span className="text-saffron font-bold text-lg">SD</span>
              </div>
              <p className="font-bold text-gray-900">Studio Design</p>
              <p className="text-sm text-gray-500">studio@design.co.il</p>
              <p className="text-sm text-gray-500">050-1234567</p>
            </div>
          </div>

          {/* Client */}
          <div className="mb-8 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-1">{C.quote_for}</p>
            <p className="font-semibold text-gray-900 text-lg">{C.client_name}</p>
            <p className="text-gray-600">{C.client_company}</p>
            <p className="text-sm text-gray-500">michal@startupxyz.co.il</p>
          </div>

          {/* Preamble */}
          <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{C.about_project}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{C.preamble}</p>
          </div>

          {/* Items table - desktop */}
          <table className="hidden sm:table w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-right py-3 font-semibold text-gray-700">{C.col_item}</th>
                <th className="text-center py-3 font-semibold text-gray-700 w-32">{C.col_price}</th>
                <th className="text-left py-3 font-semibold text-gray-700 w-28">{C.col_total}</th>
              </tr>
            </thead>
            <tbody>
              {C.items.map((item) => (
                <tr key={item.name} className="border-b border-gray-100">
                  <td className="py-3.5">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                  </td>
                  <td className="py-3.5 text-center text-gray-700">{fmt(item.price)}</td>
                  <td className="py-3.5 text-left font-medium">{fmt(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Items - mobile */}
          <div className="sm:hidden flex flex-col divide-y divide-gray-100 mb-6">
            {C.items.map((item) => (
              <div key={item.name} className="py-3.5 flex justify-between items-start gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                </div>
                <p className="font-semibold text-gray-900 shrink-0">{fmt(item.price)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{C.subtotal}</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{C.vat}</span>
                <span>{fmt(vat)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-gray-200 pt-3 font-black text-xl">
                <span>{C.grand_total}</span>
                <span className="text-indigo-600">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment milestones */}
          <div className="pt-6 border-t border-gray-100 mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">{C.payment_schedule}</p>
            <div className="flex flex-col gap-1.5">
              {C.milestones.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{i + 1}. {m.title}</span>
                  <div className="flex items-center gap-4 text-left">
                    <span className="text-gray-400 text-xs">{m.date}</span>
                    <span className="text-gray-500 w-10 text-center">{m.pct}%</span>
                    <span className="font-medium text-gray-900 w-24 text-left">{fmt(Math.round(total * m.pct / 100))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="pt-6 border-t border-gray-100 mt-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">{C.notes_label}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{C.notes}</p>
          </div>
        </div>

        {/* Actions */}
        {step === 'idle' && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">{C.what_do_you_think}</p>
              <p className="text-sm text-gray-500 mt-0.5">{C.action_sub}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('declined')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <XCircle className="h-4 w-4" />
                {C.decline}
              </button>
              <button
                onClick={() => setStep('signing')}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors text-sm font-semibold"
              >
                <CheckCircle className="h-4 w-4" />
                {C.accept}
              </button>
            </div>
          </div>
        )}

        {step === 'signing' && (
          <div className="mt-4 bg-white rounded-2xl border border-indigo-200 p-6" dir={dir}>
            <h3 className="font-semibold text-gray-900 mb-4">{C.sign_title}</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">{C.full_name}</label>
                <input
                  value={signerName}
                  onChange={e => { setSignerName(e.target.value); setError('') }}
                  placeholder={C.name_placeholder}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">{C.signature_label}</label>
                  <button type="button" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                    <RotateCcw className="h-3 w-3" />
                    {C.clear}
                  </button>
                </div>
                <div className="relative border border-gray-200 rounded-xl bg-gray-50 h-32 flex items-center justify-center cursor-crosshair">
                  <p className="text-sm text-gray-300 select-none">{C.sign_here}</p>
                </div>
                <p className="text-xs text-gray-400">{C.sig_demo_note}</p>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3 mt-1">
                <button onClick={() => setStep('idle')} className="border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  {C.back}
                </button>
                <button onClick={handleAccept} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                  {C.confirm}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-4 bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-green-800 text-lg mb-1">{C.done_title}</p>
            <p className="text-green-700 text-sm mb-6">{C.done_sub}</p>
            <Link
              href="/auth/signup"
              className="inline-block bg-saffron hover:bg-saffron-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              {C.signup_cta}
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted/40 mt-8">
          Powered by{' '}
          <a href="http://www.tripleai.co.il" target="_blank" rel="noopener noreferrer" className="font-medium text-muted/60 hover:text-muted/80 transition-colors">
            TripleA.I
          </a>
        </p>
      </div>
    </div>
  )
}
