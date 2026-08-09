import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Link2, FileSignature, Languages } from 'lucide-react'
import type { Lang } from '@/lib/i18n'
import { LandingLangToggle } from '@/components/layout/landing-lang-toggle'

const copy = {
  he: {
    login: 'כניסה',
    signup: 'הרשמה',
    hero_title: 'הצעות מחיר שהלקוחות אוהבים לקבל',
    hero_sub: 'שלח לינק — הלקוח פותח, קורא, ומאשר עם חתימה דיגיטלית. ללא הרשמה.',
    cta_start: 'התחל בחינם',
    cta_demo: 'ראה דמו חי',
    features_title: 'כל מה שפרילנסר צריך',
    f1_title: 'לינק חכם',
    f1_body: 'העתק קישור ושלח ב-WhatsApp, אימייל או SMS. הלקוח לא צריך להירשם.',
    f2_title: 'חתימה דיגיטלית',
    f2_body: 'הלקוח מאשר ישירות בעמוד — אתה מקבל עדכון בזמן אמת.',
    f3_title: 'עברית ואנגלית',
    f3_body: 'RTL מלא, מע"מ 18%, שקל ישראלי. גם עוסקים זעירים (פטור ממע"מ).',
    demo_title: 'מה הלקוח שלך רואה',
    demo_sub: 'עמוד נקי ומקצועי עם הלוגו שלך — ללא הסחות דעת',
    demo_cta: 'צפה בדמו חי ←',
    final_title: 'מוכן לשלוח הצעה ראשונה?',
    final_sub: 'חינמי לגמרי. ללא כרטיס אשראי.',
    final_cta: 'צור חשבון בחינם',
    faq: 'שאלות נפוצות',
  },
  en: {
    login: 'Sign in',
    signup: 'Sign up',
    hero_title: 'Quotes your clients love to receive',
    hero_sub: 'Send a link — the client opens it, reads it, and signs digitally. No registration required.',
    cta_start: 'Start for free',
    cta_demo: 'See live demo',
    features_title: 'Everything a freelancer needs',
    f1_title: 'Smart link',
    f1_body: 'Copy a link and send via WhatsApp, email, or SMS. No client sign-up required.',
    f2_title: 'Digital signature',
    f2_body: 'Client approves directly on the page — you get a real-time notification.',
    f3_title: 'Hebrew & English',
    f3_body: 'Full RTL support, 18% VAT, Israeli Shekel. VAT-exempt freelancers supported.',
    demo_title: 'See what your client sees',
    demo_sub: 'A clean, professional page with your logo — no distractions',
    demo_cta: 'View live demo →',
    final_title: 'Ready to send your first quote?',
    final_sub: 'Completely free. No credit card required.',
    final_cta: 'Create free account',
    faq: 'FAQ',
  },
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const cookieStore = await cookies()
  const lang: Lang = cookieStore.get('qdl')?.value === 'en' ? 'en' : 'he'
  const C = copy[lang]

  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <nav className="bg-obsidian px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-white font-bold text-[15px] tracking-tight">QuoteDock</span>
        </div>
        <div className="flex items-center gap-4">
          <LandingLangToggle lang={lang} />
          <Link href="/auth/login" className="text-white/50 hover:text-white text-sm transition-colors">
            {C.login}
          </Link>
          <Link
            href="/auth/signup"
            className="bg-saffron hover:bg-saffron-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            {C.signup}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-obsidian px-6 pt-20 pb-28 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight max-w-2xl mx-auto">
          {C.hero_title}
        </h1>
        <p className="mt-5 text-white/55 text-lg max-w-xl mx-auto leading-relaxed">
          {C.hero_sub}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/auth/signup"
            className="bg-saffron hover:bg-saffron-600 text-white font-semibold px-7 py-3 rounded-xl transition-colors text-base"
          >
            {C.cta_start}
          </Link>
          <Link
            href="/q/demo"
            target="_blank"
            className="border border-white/20 hover:border-white/40 text-white/75 hover:text-white font-medium px-7 py-3 rounded-xl transition-colors text-base"
          >
            {C.cta_demo}
          </Link>
        </div>

        {/* Product mockup */}
        <div className="mt-16 max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden text-right" dir="rtl">
          {/* Quote header */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] text-gray-400 font-mono mb-1">QD-2025-042</p>
              <h3 className="text-base font-bold text-gray-900 leading-snug">פיתוח אפליקציית מובייל</h3>
              <p className="text-xs text-gray-400 mt-0.5">עבור: מיקאל כהן, StartupXYZ</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-saffron/10 flex items-center justify-center shrink-0">
              <span className="text-saffron text-xs font-bold">SD</span>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 py-4 flex flex-col gap-3">
            {[
              { name: 'אפיון UX ומסעות משתמש', price: '₪4,500' },
              { name: 'עיצוב UI — מסכים מלאים', price: '₪6,000' },
              { name: 'פיתוח React Native', price: '₪18,000' },
            ].map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="font-mono font-medium text-gray-900">{item.price}</span>
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mx-6 pt-3 border-t border-gray-100 pb-1">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span className="font-mono">₪28,500</span>
              <span>סכום ביניים</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
              <span className="font-mono">₪5,130</span>
              <span>מע"מ 18%</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="font-mono text-lg text-gray-900">₪33,630</span>
              <span className="text-sm text-gray-700">סה"כ לתשלום</span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 flex gap-2">
            <div className="flex-1 bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-default">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              אישור ההצעה
            </div>
            <div className="px-4 border border-red-200 text-red-400 text-sm rounded-xl flex items-center cursor-default">דחייה</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-ink mb-12">{C.features_title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { Icon: Link2, title: C.f1_title, body: C.f1_body },
            { Icon: FileSignature, title: C.f2_title, body: C.f2_body },
            { Icon: Languages, title: C.f3_title, body: C.f3_body },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl border border-border p-6">
              <div className="w-10 h-10 rounded-xl bg-saffron-50 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-saffron" />
              </div>
              <h3 className="font-semibold text-ink mb-1.5">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo CTA */}
      <section className="px-6 py-16 bg-saffron-50 border-y border-saffron-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-ink mb-2">{C.demo_title}</h2>
          <p className="text-muted mb-7 text-base">{C.demo_sub}</p>
          <Link
            href="/q/demo"
            target="_blank"
            className="inline-block bg-saffron hover:bg-saffron-600 text-white font-semibold px-7 py-3 rounded-xl transition-colors text-base"
          >
            {C.demo_cta}
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-obsidian px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">{C.final_title}</h2>
        <p className="text-white/40 mb-9 text-base">{C.final_sub}</p>
        <Link
          href="/auth/signup"
          className="inline-block bg-saffron hover:bg-saffron-600 text-white font-bold px-9 py-3.5 rounded-xl transition-colors text-base"
        >
          {C.final_cta}
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-obsidian border-t border-obsidian-700 px-6 py-5 flex items-center justify-between text-xs text-white/25">
        <span>© 2025 QuoteDock</span>
        <Link href="/faq" className="hover:text-white/50 transition-colors">
          {C.faq}
        </Link>
      </footer>
    </div>
  )
}
