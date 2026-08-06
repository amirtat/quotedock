import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/settings-form'
import { FALLBACK_VAT_RATE } from '@/lib/utils'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileResult, configResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('app_config').select('value').eq('key', 'default_vat_rate').single(),
  ])

  const systemDefaultVat = Number(configResult.data?.value ?? FALLBACK_VAT_RATE)

  return <SettingsForm profile={profileResult.data} userId={user.id} systemDefaultVat={systemDefaultVat} />
}
