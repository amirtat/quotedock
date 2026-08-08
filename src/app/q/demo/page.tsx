'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, RotateCcw, ArrowLeft } from 'lucide-react'

const ITEMS = [
  { name: 'אפיון UX ומסעות משתמש', description: 'ראיונות משתמש, wireframes ומפרט מפורט', price: 4500 },
  { name: 'עיצוב UI — מסכים מלאים', description: 'כל מסכי האפליקציה ב-Figma, כולל responsive', price: 6000 },
  { name: 'פיתוח React Native', description: 'iOS + Android, אינטגרציה ל-API קיים', price: 18000 },
  { name: 'בדיקות QA ועלייה לאוויר', description: 'בדיקות מלאות ופרסום ל-App Store ו-Google Play', price: 3500 },
]

const subtotal = ITEMS.reduce((s, i) => s + i.price, 0) // 32,000
const vat = Math.round(subtotal * 0.18)                   // 5,760
const total = subtotal + vat                               // 37,760

function fmt(n: number) {
  return '₪' + n.toLocaleString('he-IL')
}

export default function DemoQuotePage() {
  const [step, setStep] = useState<'idle' | 'signing' | 'done'>('idle')
  const [signerName, setSignerName] = useState('')
  const [error, setError] = useState('')

  function handleAccept() {
    if (!signerName.trim()) { setError('נא להזין שם מלא'); return }
    setStep('done')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Demo banner */}
        <div className="mb-5 rounded-xl bg-saffron-50 border border-saffron-100 px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-saffron text-sm">זהו דמו בלבד</p>
            <p className="text-saffron/70 text-xs mt-0.5">אפשר לנסות את חוויית הלקוח — שום דבר לא נשמר</p>
          </div>
          <Link
            href="/auth/signup"
            className="bg-saffron hover:bg-saffron-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            צור חשבון בחינם ←
          </Link>
        </div>

        {/* Quote document */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8" dir="rtl">

          {/* Header */}
          <div className="flex justify-between items-start mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">פיתוח אפליקציית מובייל</h1>
              <p className="text-gray-400 mt-1 font-mono text-sm">QD-2025-042</p>
              <p className="text-gray-400 text-sm mt-0.5">01/08/2025</p>
              <p className="text-sm text-gray-400 mt-1">בתוקף עד: 31/08/2025</p>
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
            <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-1">הצעה עבור</p>
            <p className="font-semibold text-gray-900 text-lg">מיקאל כהן</p>
            <p className="text-gray-600">StartupXYZ</p>
            <p className="text-sm text-gray-500">michal@startupxyz.co.il</p>
          </div>

          {/* Preamble */}
          <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">על הפרויקט</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              פיתוח אפליקציית מובייל מלאה עבור StartupXYZ, כולל אפיון, עיצוב ופיתוח ל-iOS ו-Android.
              האפליקציה תכלול אינטגרציה ל-API הקיים, ממשק RTL מלא ותמיכה בשפה העברית.
            </p>
          </div>

          {/* Items table - desktop */}
          <table className="hidden sm:table w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-right py-3 font-semibold text-gray-700">פריט</th>
                <th className="text-center py-3 font-semibold text-gray-700 w-32">מחיר יחידה</th>
                <th className="text-left py-3 font-semibold text-gray-700 w-28">סכום</th>
              </tr>
            </thead>
            <tbody>
              {ITEMS.map((item) => (
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
            {ITEMS.map((item) => (
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
                <span>סכום ביניים</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>מע"מ (18%)</span>
                <span>{fmt(vat)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-gray-200 pt-3 font-black text-xl">
                <span>סה"כ</span>
                <span className="text-indigo-600">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment milestones */}
          <div className="pt-6 border-t border-gray-100 mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">לוח תשלומים</p>
            <div className="flex flex-col gap-1.5">
              {[
                { title: 'מקדמה — תחילת עבודה', pct: 40, date: '01/08/2025' },
                { title: 'אבן דרך — אישור עיצובים', pct: 30, date: '01/09/2025' },
                { title: 'יתרה — מסירה סופית', pct: 30, date: '01/10/2025' },
              ].map((m, i) => (
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
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">הערות</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              ההצעה כוללת שני סבבי תיקונים לכל שלב. שינויים מעבר לכך יחויבו בנפרד.
              הנ"ל אינו כולל תשתית ענן/שרתים. זמן פיתוח משוער: 12–14 שבועות.
            </p>
          </div>
        </div>

        {/* Actions */}
        {step === 'idle' && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">מה דעתך על ההצעה?</p>
              <p className="text-sm text-gray-500 mt-0.5">תוכל לאשר, לחתום ולשלוח בחזרה — הכל כאן</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => alert('בדמו זה לא עובד — אבל בחשבון אמיתי הלקוח יקבל הודעת דחייה')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <XCircle className="h-4 w-4" />
                דחייה
              </button>
              <button
                onClick={() => setStep('signing')}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors text-sm font-semibold"
              >
                <CheckCircle className="h-4 w-4" />
                אישור ההצעה
              </button>
            </div>
          </div>
        )}

        {step === 'signing' && (
          <div className="mt-4 bg-white rounded-2xl border border-indigo-200 p-6" dir="rtl">
            <h3 className="font-semibold text-gray-900 mb-4">אישור וחתימה</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">שם מלא *</label>
                <input
                  value={signerName}
                  onChange={e => { setSignerName(e.target.value); setError('') }}
                  placeholder="ישראל ישראלי"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">חתימה *</label>
                  <button type="button" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                    <RotateCcw className="h-3 w-3" />
                    נקה
                  </button>
                </div>
                <div className="relative border border-gray-200 rounded-xl bg-gray-50 h-32 flex items-center justify-center cursor-crosshair">
                  <p className="text-sm text-gray-300 select-none">חתום כאן</p>
                  <div className="absolute inset-0 rounded-xl" />
                </div>
                <p className="text-xs text-gray-400">בדמו זה לא ניתן לחתום — אבל בחשבון אמיתי יהיה כאן לוח חתימה</p>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3 mt-1">
                <button onClick={() => setStep('idle')} className="border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  חזרה
                </button>
                <button onClick={handleAccept} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                  אני מאשר/ת את ההצעה
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-4 bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-green-800 text-lg mb-1">הצעה אושרה! (דמו)</p>
            <p className="text-green-700 text-sm mb-6">
              בחשבון אמיתי — הפרילנסר היה מקבל עדכון בזמן אמת עם החתימה שלך
            </p>
            <Link
              href="/auth/signup"
              className="inline-block bg-saffron hover:bg-saffron-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              צור חשבון בחינם ←
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
