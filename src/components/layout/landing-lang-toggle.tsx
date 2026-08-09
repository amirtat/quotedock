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
    <div className="flex items-center gap-0.5">
      {([['he', '🇮🇱'], ['en', '🇬🇧']] as const).map(([l, flag]) => (
        <button
          key={l}
          onClick={l !== lang ? () => handleSwitch(l) : undefined}
          title={l === 'he' ? 'עברית' : 'English'}
          className={`px-1 py-0.5 rounded text-base leading-none transition-opacity ${
            l === lang ? 'opacity-100' : 'opacity-30 hover:opacity-60'
          }`}
        >
          {flag}
        </button>
      ))}
    </div>
  )
}
