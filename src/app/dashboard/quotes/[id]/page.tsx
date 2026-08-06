import { createClient } from '@/lib/supabase/server'
import { QuoteBuilder } from '@/components/quotes/quote-builder'
import { notFound } from 'next/navigation'

export default async function EditQuotePage({ params }: PageProps<'/dashboard/quotes/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [quoteResult, itemsResult, clientsResult, servicesResult, profileResult] = await Promise.all([
    supabase.from('quotes').select('*, client:clients(name)').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('services').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('vat_rate, currency').eq('id', user.id).single(),
  ])

  if (!quoteResult.data) notFound()

  const year = new Date().getFullYear()
  const { data: countData } = await supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  const nextNumber = `QD-${year}-${String((countData as any)?.length + 1 || 1).padStart(3, '0')}`

  return (
    <QuoteBuilder
      quoteId={id}
      initialData={quoteResult.data}
      initialItems={itemsResult.data || []}
      clients={clientsResult.data || []}
      services={servicesResult.data || []}
      userId={user.id}
      vatRate={profileResult.data?.vat_rate ?? 18}
      currency={profileResult.data?.currency || 'ILS'}
      nextNumber={nextNumber}
    />
  )
}
