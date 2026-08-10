import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Link2, BellRing, Globe, Package, BarChart2, LayoutTemplate } from 'lucide-react'
import type { Lang } from '@/lib/i18n'
import { LandingLangToggle } from '@/components/layout/landing-lang-toggle'

const copy = {
  he: {
    login: 'כניסה',
    signup: 'הרשמה',
    hero_title: 'מהצעה לחתימה, בלינק אחד',
    hero_sub: 'לסוכנויות, יועצים, קבלנים וסטודיו. הצעה ראשונה תוך חמש דקות.',
    cta_start: 'התחל בחינם',
    cta_demo: 'ראה דמו חי',
    features_title: 'כל מה שעסק צריך כדי לסגור',
    f1_title: 'הלקוח לא צריך להירשם',
    f1_body: 'לינק אחד בווטסאפ - נפתח בכל מכשיר, בלי הרשמה.',
    f2_title: 'תדע בדיוק מתי הלקוח אישר',
    f2_body: 'עדכון מיידי ברגע שהלקוח לוחץ אישור - ללא צורך לשאול ולהמתין.',
    f3_title: 'בנוי לישראל',
    f3_body: 'עברית, שקלים, מע"מ ועוסק פטור - בלי מאבק.',
    f4_title: 'קטלוג שירותים',
    f4_body: 'שמור את השירותים והמחירים שלך - הוסף לכל הצעה בלחיצה.',
    f5_title: 'עקוב אחרי כל הצעה',
    f5_body: 'טיוטה, נשלחה, נצפתה, נחתמה - הכל בדשבורד אחד.',
    f6_title: 'תבניות לחיסכון בזמן',
    f6_body: 'בנה הצעה פעם אחת, שמור כתבנית - שלח שוב בשניות.',
    final_title: 'מוכן לשלוח הצעה ראשונה?',
    final_sub: 'חינם בשלב זה. ללא כרטיס אשראי.',
    final_cta: 'צור חשבון בחינם',
    faq: 'שאלות נפוצות',
    mockup_title: 'פיתוח אפליקציית מובייל',
    mockup_client: 'עבור: מיקאל כהן, StartupXYZ',
    mockup_items: [
      { name: 'אפיון UX ומסעות משתמש', price: '₪4,500' },
      { name: 'עיצוב UI - מסכים מלאים', price: '₪6,000' },
      { name: 'פיתוח React Native', price: '₪18,000' },
    ],
    mockup_subtotal_label: 'סכום ביניים',
    mockup_vat_label: 'מע"מ 18%',
    mockup_total_label: 'סה"כ לתשלום',
    mockup_accept: 'אישור ההצעה',
    mockup_decline: 'דחייה',
  },
  en: {
    login: 'Sign in',
    signup: 'Sign up',
    hero_title: 'From quote to signature, in one link',
    hero_sub: 'For agencies, consultants, contractors and studios. First quote in five minutes.',
    cta_start: 'Start for free',
    cta_demo: 'See live demo',
    features_title: 'Everything a business needs to close',
    f1_title: 'No client sign-up needed',
    f1_body: 'One link on WhatsApp - opens on any device, no registration.',
    f2_title: 'Know exactly when your client approves',
    f2_body: 'Instant update the moment they click approve - no waiting, no follow-ups.',
    f3_title: 'Built for Israel',
    f3_body: 'Hebrew, Shekels, VAT and VAT-exempt - no configuration needed.',
    f4_title: 'Services catalog',
    f4_body: 'Save your services and prices - add to any quote in one click.',
    f5_title: 'Track every quote',
    f5_body: 'Draft, sent, viewed, signed - all in one dashboard.',
    f6_title: 'Time-saving templates',
    f6_body: 'Build a quote once, save as template - send again in seconds.',
    final_title: 'Ready to send your first quote?',
    final_sub: 'Free for now. No credit card required.',
    final_cta: 'Create free account',
    faq: 'FAQ',
    mockup_title: 'Mobile App Development',
    mockup_client: 'For: Michal Cohen, StartupXYZ',
    mockup_items: [
      { name: 'UX Research & User Journeys', price: '₪4,500' },
      { name: 'UI Design - Full Screens', price: '₪6,000' },
      { name: 'React Native Development', price: '₪18,000' },
    ],
    mockup_subtotal_label: 'Subtotal',
    mockup_vat_label: 'VAT 18%',
    mockup_total_label: 'Total due',
    mockup_accept: 'Approve quote',
    mockup_decline: 'Decline',
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
      <nav className="bg-obsidian px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/brand/mark-primary-inverse.svg" alt="" width={28} height={28} />
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
      <section className="bg-obsidian px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-28 text-center">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-tight max-w-2xl mx-auto">
          {C.hero_title}
        </h1>
        <p className="mt-5 text-white/55 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed">
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
        <div className="mt-16 w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden text-right" dir={lang === 'he' ? 'rtl' : 'ltr'}>
          {/* Quote header */}
          <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] text-gray-400 font-mono mb-1">QD-2025-042</p>
              <h3 className="text-base font-bold text-gray-900 leading-snug">{C.mockup_title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{C.mockup_client}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-saffron/10 flex items-center justify-center shrink-0">
              <span className="text-saffron text-xs font-bold">SD</span>
            </div>
          </div>

          {/* Items */}
          <div className="px-4 sm:px-6 py-4 flex flex-col gap-3">
            {C.mockup_items.map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="font-mono font-medium text-gray-900">{item.price}</span>
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mx-4 sm:mx-6 pt-3 border-t border-gray-100 pb-1">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span className="font-mono">₪28,500</span>
              <span>{C.mockup_subtotal_label}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
              <span className="font-mono">₪5,130</span>
              <span>{C.mockup_vat_label}</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="font-mono text-lg text-gray-900">₪33,630</span>
              <span className="text-sm text-gray-700">{C.mockup_total_label}</span>
            </div>
          </div>

          {/* Actions - decorative only, not clickable */}
          <div className="px-4 sm:px-6 py-4 flex gap-2">
            <div className="flex-1 bg-green-600/40 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-default select-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {C.mockup_accept}
            </div>
            <div className="px-4 border border-red-200/40 text-red-400/40 text-sm rounded-xl flex items-center cursor-default select-none">{C.mockup_decline}</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-ink mb-12">{C.features_title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { Icon: Link2, title: C.f1_title, body: C.f1_body },
            { Icon: BellRing, title: C.f2_title, body: C.f2_body },
            { Icon: Globe, title: C.f3_title, body: C.f3_body },
            { Icon: Package, title: C.f4_title, body: C.f4_body },
            { Icon: BarChart2, title: C.f5_title, body: C.f5_body },
            { Icon: LayoutTemplate, title: C.f6_title, body: C.f6_body },
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

      {/* Final CTA */}
      <section className="bg-obsidian px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{C.final_title}</h2>
        <p className="text-white/40 mb-9 text-base">{C.final_sub}</p>
        <Link
          href="/auth/signup"
          className="inline-block bg-saffron hover:bg-saffron-600 text-white font-bold px-9 py-3.5 rounded-xl transition-colors text-base"
        >
          {C.final_cta}
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-obsidian border-t border-obsidian-700 px-4 sm:px-6 py-5 flex items-center justify-between text-xs text-white/25">
        <span>© 2026 QuoteDock</span>
        <Link href="/faq" className="hover:text-white/50 transition-colors">
          {C.faq}
        </Link>
      </footer>
    </div>
  )
}
