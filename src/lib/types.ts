export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined'

export interface Profile {
  id: string
  business_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  logo_url: string | null
  currency: string
  language: string
  vat_rate: number
  quote_number_prefix: string
  default_quote_validity_days: number
  show_quantity_default: boolean
  freelancer_signature: string | null
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  created_at: string
}

export interface Service {
  id: string
  user_id: string
  name: string
  description: string | null
  unit_price: number
  unit: string
  created_at: string
}

export interface Quote {
  id: string
  user_id: string
  client_id: string | null
  title: string
  number: string
  status: QuoteStatus
  notes: string | null
  valid_until: string | null
  discount: number
  discount_type: 'percent' | 'fixed'
  discount_reason: string | null
  include_vat: boolean
  show_quantity: boolean
  preamble: string | null
  public_token: string
  viewed_at: string | null
  accepted_at: string | null
  declined_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
  client?: Client
  items?: QuoteItem[]
}

export type RecurringInterval = 'monthly' | 'quarterly' | 'yearly'

export interface QuoteItem {
  id: string
  quote_id: string
  service_id: string | null
  name: string
  description: string | null
  quantity: number
  unit_price: number
  sort_order: number
  item_type: 'one_time' | 'recurring' | 'excluded'
  recurring_interval: RecurringInterval | null
  discount_percent?: number
  is_optional?: boolean
}

export interface QuoteSection {
  id: string
  quote_id: string
  title: string
  content: string
  position: 'start' | 'end'
  sort_order: number
}

export interface NoteTemplate {
  id: string
  user_id: string
  title: string
  content: string
  sort_order: number
  created_at: string
}

export interface PaymentMilestone {
  id: string
  quote_id: string
  title: string
  percent: number
  due_date: string | null
  sort_order: number
}

export interface QuoteAttachment {
  id: string
  quote_id: string
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  sort_order: number
  created_at: string
}

export interface Signature {
  id: string
  quote_id: string
  signer_name: string
  signer_email: string | null
  signature_data: string
  signed_at: string
}
