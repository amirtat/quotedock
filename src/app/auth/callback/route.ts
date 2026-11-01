import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .single()

      const lang = profile?.language === 'en' ? 'en' : 'he'
      const response = NextResponse.redirect(`${origin}/dashboard`)
      response.cookies.set('qdl', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 })
      return response
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
