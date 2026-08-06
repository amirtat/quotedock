'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, calcTotal } from '@/lib/utils'
import { Client, QuoteItem, Quote, Service, NoteTemplate } from '@/lib/types'
import { Plus, Trash2, Save, Send, Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface QuoteBuilderProps {
  quoteId?: string
  initialData?: Partial<Quote>
  initialItems?: QuoteItem[]
  clients: Client[]
  services: Service[]
  userId: string
  vatRate: number
  currency: string
  nextNumber: string
  defaultValidUntil?: string
  noteTemplates?: NoteTemplate[]
}

function emptyItem(sortOrder: number): Omit<QuoteItem, 'id' | 'quote_id'> {
  return { service_id: null, name: '', description: '', quantity: 1, unit_price: 0, sort_order: sortOrder }
}

export function QuoteBuilder({
  quoteId: initialQuoteId,
  initialData,
  initialItems = [],
  clients,
  services,
  userId,
  vatRate,
  currency,
  nextNumber,
  defaultValidUntil,
}: QuoteBuilderProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const [title, setTitle] = useState(initialData?.title || '')
  const [clientId, setClientId] = useState(initialData?.client_id || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [validUntil, setValidUntil] = useState(initialData?.valid_until || defaultValidUntil || '')
  const [discount, setDiscount] = useState(initialData?.discount || 0)
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(initialData?.discount_type || 'percent')
  const [discountReason, setDiscountReason] = useState(initialData?.discount_reason || '')
  const [includeVat, setIncludeVat] = useState(initialData?.include_vat ?? (vatRate > 0))
  const [items, setItems] = useState<Array<Omit<QuoteItem, 'id' | 'quote_id'> & { id?: string }>>(
    initialItems.length > 0 ? initialItems : [emptyItem(0)]
  )
  const [quoteId, setQuoteId] = useState(initialQuoteId || null)

  const { subtotal, discountAmount, vatAmount, total } = calcTotal(items as QuoteItem[], discount, vatRate, includeVat, discountType)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem(prev.length)])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: string, value: string | number) {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function fillFromService(index: number, serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    setItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, service_id: serviceId, name: service.name, description: service.description || '', unit_price: service.unit_price } : item
      )
    )
  }

  async function save(status: 'draft' | 'sent' = 'draft') {
    if (!title.trim()) return showToast('נא להזין כותרת', 'err')
    if (items.some(i => !i.name.trim())) return showToast('נא למלא שם לכל הפריטים', 'err')

    setSaving(true)
    const supabase = createClient()

    try {
      let currentQuoteId = quoteId

      if (!currentQuoteId) {
        const { data, error } = await supabase.from('quotes').insert({
          user_id: userId, title, number: nextNumber,
          client_id: clientId || null, notes: notes || null,
          valid_until: validUntil || null, discount, discount_type: discountType,
          discount_reason: discountReason || null, include_vat: includeVat, status,
        }).select('id').single()
        if (error) throw error
        currentQuoteId = data.id
        setQuoteId(currentQuoteId)
      } else {
        const { error } = await supabase.from('quotes').update({
          title, client_id: clientId || null, notes: notes || null,
          valid_until: validUntil || null, discount, discount_type: discountType,
          discount_reason: discountReason || null, include_vat: includeVat, status,
          ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
        }).eq('id', currentQuoteId)
        if (error) throw error
      }

      await supabase.from('quote_items').delete().eq('quote_id', currentQuoteId)
      await supabase.from('quote_items').insert(
        items.map((item, i) => ({
          quote_id: currentQuoteId, service_id: item.service_id || null,
          name: item.name, description: item.description || null,
          quantity: Number(item.quantity), unit_price: Number(item.unit_price), sort_order: i,
        }))
      )

      showToast(status === 'sent' ? 'ההצעה נשלחה ✓' : 'נשמר ✓')
      router.push(`/dashboard/quotes/${currentQuoteId}/preview`)
    } catch {
      showToast('שגיאה בשמירה', 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-1/2 translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${toast.type === 'ok' ? 'bg-obsidian text-white' : 'bg-danger text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-white shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quotes" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="h-4 w-4" />
            הצעות
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="text-sm font-medium text-ink">{title || 'הצעה חדשה'}</span>
            <span className="text-xs text-muted mr-2 font-mono">{initialData?.number || nextNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {quoteId && (
            <Link href={`/dashboard/quotes/${quoteId}/preview`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
                תצוגה מקדימה
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => save('draft')} loading={saving}>
            <Save className="h-4 w-4" />
            שמור טיוטה
          </Button>
          <Button size="sm" onClick={() => save('sent')} loading={saving}>
            <Send className="h-4 w-4" />
            שמור ושלח
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main form */}
        <div className="flex-1 overflow-y-auto bg-surface/40 p-6">
          <div className="max-w-2xl mx-auto flex flex-col gap-5">

            {/* Quote header */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <Label htmlFor="title">כותרת הצעה *</Label>
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="עיצוב אתר אינטרנט"
                    className="flex h-10 w-full rounded-lg border-0 bg-transparent px-0 text-xl font-bold text-ink placeholder:text-muted/40 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>לקוח</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר לקוח" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ללא לקוח</SelectItem>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="validUntil">בתוקף עד</Label>
                  <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} dir="ltr" />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">פריטים</h2>

              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 text-xs text-muted mb-2 px-1">
                <div className="col-span-5">שם / תיאור</div>
                <div className="col-span-3">שירות</div>
                <div className="col-span-2 text-center">כמות</div>
                <div className="col-span-1 text-center">מחיר</div>
                <div className="col-span-1" />
              </div>

              <div className="flex flex-col gap-2">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg bg-surface/60 border border-border/60">
                    <div className="col-span-5 flex flex-col gap-1.5">
                      <Input value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} placeholder="שם הפריט" />
                      <Input value={item.description || ''} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="תיאור" className="text-xs" />
                    </div>
                    <div className="col-span-3">
                      <Select value={item.service_id || ''} onValueChange={(val) => val && fillFromService(index, val)}>
                        <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                        <SelectContent>
                          {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} className="text-center" dir="ltr" />
                    </div>
                    <div className="col-span-1">
                      <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} className="text-center text-xs" dir="ltr" />
                    </div>
                    <div className="col-span-1 flex items-center justify-center pt-1">
                      <button onClick={() => removeItem(index)} className="p-1 text-muted/50 hover:text-danger transition-colors" disabled={items.length === 1}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addItem} className="flex items-center gap-1.5 text-sm text-saffron hover:text-saffron-600 font-medium mt-4 px-1 transition-colors">
                <Plus className="h-4 w-4" />
                הוסף פריט
              </button>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">הערות</h2>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="תנאי תשלום, הערות נוספות..." rows={3} />
            </div>
          </div>
        </div>

        {/* Total panel — the signature element */}
        <div className="w-64 bg-obsidian flex flex-col shrink-0 border-r border-obsidian-800">
          <div className="p-5 border-b border-obsidian-700">
            <p className="text-white/30 text-xs uppercase tracking-wider font-medium">סיכום</p>
          </div>

          <div className="flex-1 p-5 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">סכום ביניים</span>
              <span className="text-white/80 font-amount">{formatCurrency(subtotal, currency)}</span>
            </div>

            {/* Discount input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${discountType === 'percent' ? 'bg-saffron text-obsidian-900 font-medium' : 'text-white/40 hover:text-white/60'}`}
                  >%</button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${discountType === 'fixed' ? 'bg-saffron text-obsidian-900 font-medium' : 'text-white/40 hover:text-white/60'}`}
                  >₪</button>
                  <span className="text-white/40 text-sm me-1">הנחה</span>
                </div>
                <input
                  type="number" min="0"
                  max={discountType === 'percent' ? 100 : undefined}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-16 text-center text-sm bg-obsidian-700 text-white border border-obsidian-700 rounded-lg px-2 py-1 focus:outline-none focus:border-saffron"
                  dir="ltr"
                />
              </div>
              {discount > 0 && (
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="סיבת הנחה (אופציונלי)"
                  className="text-xs bg-obsidian-700 text-white/60 border border-obsidian-700 rounded-lg px-2 py-1 focus:outline-none focus:border-saffron placeholder-white/20 w-full"
                />
              )}
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-400/70">הנחה{discountReason ? ` (${discountReason})` : ''}</span>
                <span className="text-red-400 font-amount">-{formatCurrency(discountAmount, currency)}</span>
              </div>
            )}

            {/* VAT toggle */}
            {vatRate === 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">פטור ממע"מ</span>
                <span className="text-white/30 text-xs">עוסק זעיר</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">מע"מ {vatRate}%</span>
                  <button
                    onClick={() => setIncludeVat(!includeVat)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${includeVat ? 'bg-saffron' : 'bg-obsidian-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${includeVat ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
                {includeVat && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">מע"מ</span>
                    <span className="text-white/60 font-amount">{formatCurrency(vatAmount, currency)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Grand total — the cash register moment */}
          <div className="p-5 border-t border-obsidian-700">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-2">סה"כ לתשלום</p>
            <p className="font-amount text-saffron font-bold leading-none" style={{ fontSize: total >= 100000 ? '1.5rem' : '2rem' }}>
              {formatCurrency(total, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
