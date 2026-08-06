import { createClient } from '@/lib/supabase/server'
import { QuoteBuilder } from '@/components/quotes/quote-builder'
import { FALLBACK_VAT_RATE } from '@/lib/utils'

export default async function NewQuotePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [clientsResult, servicesResult, profileResult, countResult, noteTemplatesResult] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('services').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('vat_rate, currency, quote_number_prefix, default_quote_validity_days').eq('id', user.id).single(),
    supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('note_templates').select('*').eq('user_id', user.id).order('sort_order'),
  ])

  const profile = profileResult.data
  const prefix = profile?.quote_number_prefix || 'QD'
  const validityDays = profile?.default_quote_validity_days ?? 30
  const year = new Date().getFullYear()
  const count = (countResult.count || 0) + 1
  const nextNumber = `${prefix}-${year}-${String(count).padStart(3, '0')}`

  const defaultValidUntil = new Date()
  defaultValidUntil.setDate(defaultValidUntil.getDate() + validityDays)
  const defaultValidUntilStr = defaultValidUntil.toISOString().split('T')[0]

  return (
    <QuoteBuilder
      clients={clientsResult.data || []}
      services={servicesResult.data || []}
      userId={user.id}
      vatRate={profile?.vat_rate ?? FALLBACK_VAT_RATE}
      currency={profile?.currency || 'ILS'}
      nextNumber={nextNumber}
      defaultValidUntil={defaultValidUntilStr}
      noteTemplates={noteTemplatesResult.data || []}
    />
  )
}
