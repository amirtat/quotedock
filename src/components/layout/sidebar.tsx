'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
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
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/quotes', label: 'הצעות מחיר', icon: FileText },
  { href: '/dashboard/templates', label: 'תבניות', icon: LayoutTemplate },
  { href: '/dashboard/clients', label: 'לקוחות', icon: Users },
  { href: '/dashboard/services', label: 'שירותים', icon: Briefcase },
  { href: '/dashboard/settings', label: 'הגדרות', icon: Settings },
]

interface SidebarProps {
  businessName?: string | null
  email?: string | null
  logoUrl?: string | null
  lang?: string
}

export function Sidebar({ businessName, email, logoUrl }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const initials = businessName
    ? businessName.slice(0, 2).toUpperCase()
    : email?.slice(0, 2).toUpperCase() || 'QD'

  return (
    <aside className="w-56 min-h-screen bg-obsidian flex flex-col shrink-0 select-none">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-white font-bold text-[15px] tracking-tight">QuoteDock</span>
        </div>
      </div>

      {/* New quote CTA */}
      <div className="px-3 mb-3">
        <Link
          href="/dashboard/quotes/new"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-saffron text-white text-sm font-medium hover:bg-saffron-600 transition-colors"
        >
          <Plus className="h-4 w-4 shrink-0" />
          הצעה חדשה
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-3 mb-3 h-px bg-obsidian-700" />

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-obsidian-700 text-white'
                  : 'text-white/40 hover:text-white/80 hover:bg-obsidian-800'
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-saffron')} />
              {item.label}
              {isActive && <span className="mr-auto w-1 h-1 rounded-full bg-saffron" />}
            </Link>
          )
        })}
      </nav>

      {/* FAQ */}
      <div className="px-3 mb-2">
        <Link
          href="/faq"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/30 hover:text-white/70 hover:bg-obsidian-800 transition-colors"
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          שאלות נפוצות
        </Link>
      </div>

      {/* User */}
      <div className="px-3 pb-4 mt-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-saffron/20">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName || ''} className="w-full h-full object-contain" />
            ) : (
              <span className="text-saffron text-xs font-bold">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{businessName || 'העסק שלי'}</p>
            <p className="text-white/30 text-[10px] truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/30 hover:text-white/70 hover:bg-obsidian-800 transition-colors mt-1"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          יציאה
        </button>
      </div>
    </aside>
  )
}
