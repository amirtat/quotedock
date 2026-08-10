'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLang } from '@/lib/lang-context'

const copy = {
  he: {
    brand_tag: 'בחינם לגמרי',
    hero_title_1: 'הצעה ראשונה',
    hero_title_2: 'תוך',
    hero_title_accent: '3 דקות',
    features: ['הצעות מחיר בעברית', 'קישור שיתוף ללקוח', 'אישור דיגיטלי', 'ניהול לקוחות ושירותים'],
    page_title: 'יצירת חשבון חינמי',
    page_sub: 'בלי כרטיס אשראי, בלי מגבלת זמן',
    google: 'המשך עם Google',
    or: 'או',
    business_label: 'שם העסק',
    business_placeholder: 'הסטודיו שלי',
    email_label: 'אימייל',
    password_label: 'סיסמה',
    password_placeholder: 'לפחות 6 תווים',
    submit: 'יצירת חשבון',
    have_account: 'כבר יש חשבון?',
    login_link: 'כניסה',
  },
  en: {
    brand_tag: 'Completely free',
    hero_title_1: 'First quote',
    hero_title_2: 'in',
    hero_title_accent: '3 minutes',
    features: ['Hebrew quotes with RTL', 'Shareable client link', 'Digital approval', 'Client & service management'],
    page_title: 'Create your free account',
    page_sub: 'No credit card, no time limit',
    google: 'Continue with Google',
    or: 'or',
    business_label: 'Business name',
    business_placeholder: 'My Studio',
    email_label: 'Email',
    password_label: 'Password',
    password_placeholder: 'At least 6 characters',
    submit: 'Create account',
    have_account: 'Already have an account?',
    login_link: 'Sign in',
  },
}

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const lang = useLang()
  const C = copy[lang]

  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { business_name: businessName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').update({ business_name: businessName }).eq('id', data.user.id)
    }

    router.push(redirectTo)
    router.refresh()
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-obsidian flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10">
        <div className="flex items-center gap-2.5">
          <img src="/brand/mark-primary-inverse.svg" alt="" width={32} height={32} />
          <span className="text-white font-bold text-lg tracking-tight">QuoteDock</span>
        </div>

        <div>
          <p className="text-white/20 text-xs font-medium uppercase tracking-widest mb-4">{C.brand_tag}</p>
          <h2 className="text-white text-4xl font-bold leading-tight mb-6">
            {C.hero_title_1}<br />
            {C.hero_title_2} <span className="text-saffron">{C.hero_title_accent}</span>
          </h2>
          <ul className="flex flex-col gap-3">
            {C.features.map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/50 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-saffron shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/20 text-xs">© 2026 QuoteDock</p>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-paper">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img src="/brand/mark-primary.svg" alt="" width={28} height={28} />
            <span className="font-bold text-ink text-lg">QuoteDock</span>
          </div>

          <h1 className="text-2xl font-bold text-ink mb-1">{C.page_title}</h1>
          <p className="text-muted text-sm mb-7">{C.page_sub}</p>

          <Button
            variant="outline"
            className="w-full mb-4 gap-3 h-10"
            onClick={handleGoogleLogin}
            loading={googleLoading}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {C.google}
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted text-xs">{C.or}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business">{C.business_label}</Label>
              <Input
                id="business"
                type="text"
                placeholder={C.business_placeholder}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{C.email_label}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{C.password_label}</Label>
              <Input
                id="password"
                type="password"
                placeholder={C.password_placeholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                dir="ltr"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-10" loading={loading}>
              {C.submit}
            </Button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            {C.have_account}{' '}
            <Link href="/auth/login" className="text-saffron font-medium hover:underline">
              {C.login_link}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
