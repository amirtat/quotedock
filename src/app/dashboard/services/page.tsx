import { createClient } from '@/lib/supabase/server'
import { ServicesManager } from '@/components/services/services-manager'

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', user.id)
    .single()

  return <ServicesManager initialServices={services || []} userId={user.id} currency={profile?.currency || 'ILS'} />
}
