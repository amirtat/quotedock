import { createClient } from '@/lib/supabase/server'
import { QuoteBuilder } from '@/components/quotes/quote-builder'
import { FALLBACK_VAT_RATE } from '@/lib/utils'

export default async function NewQuotePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [clientsResult, servicesResult, profileResult, countResult, configResult] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('services').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('vat_rate, currency').eq('id', user.id).single(),
    supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('app_config').select('value').eq('key', 'default_vat_rate').single(),
  ])

  const systemDefaultVat = Number(configResult.data?.value ?? FALLBACK_VAT_RATE)
  const year = new Date().getFullYear()
  const count = (countResult.count || 0) + 1
  const nextNumber = `QD-${year}-${String(count).padStart(3, '0')}`

  return (
    <QuoteBuilder
      clients={clientsResult.data || []}
      services={servicesResult.data || []}
      userId={user.id}
      vatRate={profileResult.data?.vat_rate ?? systemDefaultVat}
      currency={profileResult.data?.currency || 'ILS'}
      nextNumber={nextNumber}
    />
  )
}
