'use client'

import { useRouter } from 'next/navigation'
import { setLangCookie } from '@/app/actions/lang-actions'
import type { Lang } from '@/lib/i18n'

export function LandingLangToggle({ lang }: { lang: Lang }) {
  const router = useRouter()

  async function handleSwitch(next: Lang) {
    await setLangCookie(next)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      {([['he', '🇮🇱', 'עב'], ['en', '🇬🇧', 'EN']] as const).map(([l, flag, label]) => (
        <button
          key={l}
          onClick={l !== lang ? () => handleSwitch(l) : undefined}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
            l === lang
              ? 'text-white/80 bg-white/10'
              : 'text-white/30 hover:text-white/60'
          }`}
        >
          <span>{flag}</span>
          <span className="font-medium">{label}</span>
        </button>
      ))}
    </div>
  )
}
