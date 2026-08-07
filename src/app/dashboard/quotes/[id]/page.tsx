import { createClient } from '@/lib/supabase/server'
import { QuoteBuilder } from '@/components/quotes/quote-builder'
import { notFound } from 'next/navigation'
import { FALLBACK_VAT_RATE } from '@/lib/utils'

export default async function EditQuotePage({ params }: PageProps<'/dashboard/quotes/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [quoteResult, itemsResult, clientsResult, servicesResult, profileResult, configResult, noteTemplatesResult, milestonesResult, attachmentsResult] = await Promise.all([
    supabase.from('quotes').select('*, client:clients(name)').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('services').select('*').eq('user_id', user.id).order('name'),
    supabase.from('profiles').select('vat_rate, currency').eq('id', user.id).single(),
    supabase.from('app_config').select('value').eq('key', 'default_vat_rate').single(),
    supabase.from('note_templates').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('payment_milestones').select('*').eq('quote_id', id).order('sort_order'),
    supabase.from('quote_attachments').select('*').eq('quote_id', id).order('sort_order'),
  ])

  if (!quoteResult.data) notFound()
  const systemDefaultVat = Number(configResult.data?.value ?? FALLBACK_VAT_RATE)

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
      vatRate={profileResult.data?.vat_rate ?? systemDefaultVat}
      currency={profileResult.data?.currency || 'ILS'}
      nextNumber={nextNumber}
      noteTemplates={noteTemplatesResult.data || []}
      initialMilestones={milestonesResult.data || []}
      initialAttachments={attachmentsResult.data || []}
    />
  )
}
