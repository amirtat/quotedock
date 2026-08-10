'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useT, useLang } from '@/lib/lang-context'
import { setLangCookie } from '@/app/actions/lang-actions'
import {
  LayoutDashboard,
  FileText,
  Users,
  Briefcase,
  Settings,
  LogOut,
  Plus,
  HelpCircle,
  LayoutTemplate,
  Menu,
  X,
} from 'lucide-react'

interface MobileTopbarProps {
  businessName?: string | null
  email?: string | null
  logoUrl?: string | null
}

export function MobileTopbar({ businessName, email, logoUrl }: MobileTopbarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const T = useT()
  const lang = useLang()

  async function handleLangSwitch() {
    const next = lang === 'he' ? 'en' : 'he'
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ language: next }).eq('id', user.id)
    await setLangCookie(next)
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard', label: T.dashboard, icon: LayoutDashboard, exact: true },
    { href: '/dashboard/quotes', label: T.quotes, icon: FileText },
    { href: '/dashboard/templates', label: T.templates, icon: LayoutTemplate },
    { href: '/dashboard/clients', label: T.clients, icon: Users },
    { href: '/dashboard/services', label: T.services, icon: Briefcase },
    { href: '/dashboard/settings', label: T.settings, icon: Settings },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const initials = businessName
    ? businessName.slice(0, 2).toUpperCase()
    : email?.slice(0, 2).toUpperCase() || 'QD'

  const drawerSide = lang === 'he' ? 'right-0' : 'left-0'
  const drawerHidden = lang === 'he' ? 'translate-x-full' : '-translate-x-full'

  return (
    <>
      {/* Top bar - mobile only */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-obsidian flex items-center justify-between px-4 h-14 no-print" dir="ltr">
        <div className="flex items-center gap-2">
          <img src="/brand/mark-primary-inverse.svg" alt="" width={24} height={24} />
          <span className="text-white font-bold text-[15px] tracking-tight">QuoteDock</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-white/60 hover:text-white p-1"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        dir="ltr"
        className={cn(
          'md:hidden fixed top-0 bottom-0 z-50 w-64 bg-obsidian flex flex-col transition-transform duration-300',
          drawerSide,
          open ? 'translate-x-0' : drawerHidden
        )}
      >
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <img src="/brand/mark-primary-inverse.svg" alt="" width={24} height={24} />
            <span className="text-white font-bold text-[15px] tracking-tight">QuoteDock</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {([['he', '🇮🇱'], ['en', '🇬🇧']] as const).map(([l, flag]) => (
                <button
                  key={l}
                  onClick={l !== lang ? handleLangSwitch : undefined}
                  title={l === 'he' ? 'עברית' : 'English'}
                  className={`px-1 py-0.5 rounded text-base leading-none transition-opacity ${
                    l === lang ? 'opacity-100' : 'opacity-30 hover:opacity-60'
                  }`}
                >
                  {flag}
                </button>
              ))}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white/80 p-1 ms-1"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* New quote CTA */}
        <div className="px-3 mb-3">
          <Link
            href="/dashboard/quotes/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-saffron text-white text-sm font-medium hover:bg-saffron-600 transition-colors"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {T.new_quote}
          </Link>
        </div>

        <div className="mx-3 mb-3 h-px bg-obsidian-700" />

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-obsidian-700 text-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-obsidian-800'
                )}
              >
                <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-saffron')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* FAQ */}
        <div className="px-3 mb-2">
          <Link
            href="/faq"
            target="_blank"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/30 hover:text-white/70 hover:bg-obsidian-800 transition-colors"
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            {T.faq}
          </Link>
        </div>

        {/* User */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-saffron/20">
              {logoUrl ? (
                <img src={logoUrl} alt={businessName || ''} className="w-full h-full object-contain" />
              ) : (
                <span className="text-saffron text-xs font-bold">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{businessName || T.business_name}</p>
              <p className="text-white/30 text-[10px] truncate">{email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/30 hover:text-white/70 hover:bg-obsidian-800 transition-colors mt-1"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {T.logout}
          </button>
        </div>
      </div>
    </>
  )
}
