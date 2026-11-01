import { createClient } from '@/lib/supabase/server'
import { ClientsManager } from '@/components/clients/clients-manager'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return <ClientsManager initialClients={clients || []} userId={user.id} />
}
