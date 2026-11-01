'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplate } from '@/lib/templates'
import { getLang } from '@/lib/i18n'

export async function createFromTemplate(slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?redirect=/templates/${slug}`)
  }

  const template = getTemplate(slug)
  if (!template) redirect('/templates')

  const { data: profile } = await supabase
    .from('profiles')
    .select('language, vat_rate, default_quote_validity_days')
    .eq('id', user.id)
    .single()

  const lang = getLang(profile?.language || 'he')

  const { data: numberData } = await supabase.rpc('get_next_quote_number', { p_user_id: user.id })
  const quoteNumber = numberData || `QD-${new Date().getFullYear()}-001`

  const validDays = profile?.default_quote_validity_days ?? template.valid_days
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + validDays)

  const { data: quote, error } = await supabase
    .from('quotes')
    .insert({
      user_id: user.id,
      title: template.title[lang],
      number: quoteNumber,
      status: 'draft',
      notes: template.notes[lang],
      include_vat: template.include_vat,
      valid_until: validUntil.toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error || !quote) redirect('/dashboard')

  const items = template.items.map((item, i) => ({
    quote_id: quote.id,
    name: item.name[lang],
    description: item.description[lang],
    unit_price: item.unit_price,
    quantity: item.quantity,
    sort_order: i,
    item_type: 'one_time',
  }))

  await supabase.from('quote_items').insert(items)

  redirect(`/dashboard/quotes/${quote.id}`)
}
