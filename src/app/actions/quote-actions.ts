'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function duplicateQuote(quoteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch original quote
  const { data: original, error: quoteErr } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .eq('user_id', user.id)
    .single()

  if (quoteErr || !original) throw new Error('Quote not found')

  // Fetch items
  const { data: items } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', quoteId)
    .order('sort_order')

  // Get next quote number
  const { count } = await supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: prefixConfig } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'quote_number_prefix')
    .single()

  const prefix = prefixConfig?.value ?? 'QD'
  const year = new Date().getFullYear()
  const nextNumber = `${prefix}-${year}-${String((count || 0) + 1).padStart(3, '0')}`

  // Create duplicate quote as draft
  const { data: newQuote, error: insertErr } = await supabase
    .from('quotes')
    .insert({
      user_id: user.id,
      client_id: original.client_id,
      title: `${original.title} (עותק)`,
      number: nextNumber,
      status: 'draft',
      notes: original.notes,
      valid_until: original.valid_until,
      discount: original.discount,
      discount_type: original.discount_type,
      discount_reason: original.discount_reason,
      include_vat: original.include_vat,
    })
    .select('id')
    .single()

  if (insertErr || !newQuote) throw new Error('Failed to duplicate quote')

  // Duplicate items
  if (items && items.length > 0) {
    await supabase.from('quote_items').insert(
      items.map((item) => ({
        quote_id: newQuote.id,
        service_id: item.service_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: item.sort_order,
      }))
    )
  }

  redirect(`/dashboard/quotes/${newQuote.id}`)
}
