import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/settings-form'
import { FALLBACK_VAT_RATE } from '@/lib/utils'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileResult, vatResult, prefixResult, validityResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('app_config').select('value').eq('key', 'default_vat_rate').single(),
    supabase.from('app_config').select('value').eq('key', 'quote_number_prefix').single(),
    supabase.from('app_config').select('value').eq('key', 'default_quote_validity_days').single(),
  ])

  const systemDefaultVat = Number(vatResult.data?.value ?? FALLBACK_VAT_RATE)
  const systemQuotePrefix = prefixResult.data?.value ?? 'QD'
  const systemValidityDays = Number(validityResult.data?.value ?? 30)

  return (
    <SettingsForm
      profile={profileResult.data}
      userId={user.id}
      systemDefaultVat={systemDefaultVat}
      systemQuotePrefix={systemQuotePrefix}
      systemValidityDays={systemValidityDays}
    />
  )
}
