'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, calcTotal } from '@/lib/utils'
import { Client, QuoteItem, Quote, Service } from '@/lib/types'
import { Plus, Trash2, Save, Send, Eye, Copy } from 'lucide-react'

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
}

function emptyItem(sortOrder: number): Omit<QuoteItem, 'id' | 'quote_id'> {
  return {
    service_id: null,
    name: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    sort_order: sortOrder,
  }
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
}: QuoteBuilderProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [title, setTitle] = useState(initialData?.title || '')
  const [clientId, setClientId] = useState(initialData?.client_id || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [validUntil, setValidUntil] = useState(initialData?.valid_until || '')
  const [discount, setDiscount] = useState(initialData?.discount || 0)
  const [includeVat, setIncludeVat] = useState(initialData?.include_vat ?? true)
  const [items, setItems] = useState<Array<Omit<QuoteItem, 'id' | 'quote_id'> & { id?: string }>>(
    initialItems.length > 0 ? initialItems : [emptyItem(0)]
  )
  const [quoteId, setQuoteId] = useState(initialQuoteId || null)

  const { subtotal, discountAmount, vatAmount, total } = calcTotal(items as QuoteItem[], discount, vatRate, includeVat)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem(prev.length)])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: string, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function fillFromService(index: number, serviceId: string) {
    const service = services.find((s) => s.id === serviceId)
    if (!service) return
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, service_id: serviceId, name: service.name, description: service.description || '', unit_price: service.unit_price }
          : item
      )
    )
  }

  async function save(status: 'draft' | 'sent' = 'draft') {
    if (!title.trim()) {
      showToast('נא להזין כותרת להצעה')
      return
    }
    if (items.some((item) => !item.name.trim())) {
      showToast('נא למלא שם לכל הפריטים')
      return
    }

    setSaving(true)
    const supabase = createClient()

    try {
      let currentQuoteId = quoteId

      if (!currentQuoteId) {
        // Create new quote
        const { data, error } = await supabase
          .from('quotes')
          .insert({
            user_id: userId,
            title,
            number: nextNumber,
            client_id: clientId || null,
            notes: notes || null,
            valid_until: validUntil || null,
            discount,
            include_vat: includeVat,
            status,
          })
          .select('id')
          .single()

        if (error) throw error
        currentQuoteId = data.id
        setQuoteId(currentQuoteId)
      } else {
        // Update existing quote
        const { error } = await supabase
          .from('quotes')
          .update({
            title,
            client_id: clientId || null,
            notes: notes || null,
            valid_until: validUntil || null,
            discount,
            include_vat: includeVat,
            status,
            ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
          })
          .eq('id', currentQuoteId)

        if (error) throw error
      }

      // Delete existing items and re-insert
      await supabase.from('quote_items').delete().eq('quote_id', currentQuoteId)
      await supabase.from('quote_items').insert(
        items.map((item, i) => ({
          quote_id: currentQuoteId,
          service_id: item.service_id || null,
          name: item.name,
          description: item.description || null,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          sort_order: i,
        }))
      )

      showToast(status === 'sent' ? 'ההצעה נשלחה ללקוח' : 'נשמר בהצלחה')
      router.push(`/dashboard/quotes/${currentQuoteId}`)
    } catch {
      showToast('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {initialData ? 'עריכת הצעה' : 'הצעה חדשה'}
          </h1>
          <p className="text-sm text-gray-500 font-mono mt-0.5">{initialData?.number || nextNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {quoteId && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/quotes/${quoteId}/preview`)}>
              <Eye className="h-4 w-4" />
              תצוגה מקדימה
            </Button>
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

      <div className="flex flex-col gap-4">
        {/* Details card */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי הצעה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="title">כותרת הצעה *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="עיצוב אתר אינטרנט"
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
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="validUntil">בתוקף עד</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items card */}
        <Card>
          <CardHeader>
            <CardTitle>פריטים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                <div className="col-span-4">שם / תיאור</div>
                <div className="col-span-3">שירות מהקטלוג</div>
                <div className="col-span-2 text-center">כמות</div>
                <div className="col-span-2 text-center">מחיר יחידה</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  {/* Name + description */}
                  <div className="col-span-4 flex flex-col gap-1.5">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="שם הפריט"
                    />
                    <Input
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="תיאור (אופציונלי)"
                      className="text-xs"
                    />
                  </div>

                  {/* Service picker */}
                  <div className="col-span-3">
                    <Select
                      value={item.service_id || ''}
                      onValueChange={(val) => val && fillFromService(index, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר שירות" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="text-center"
                      dir="ltr"
                    />
                  </div>

                  {/* Unit price */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      className="text-center"
                      dir="ltr"
                    />
                  </div>

                  {/* Delete */}
                  <div className="col-span-1 flex items-center justify-center pt-1">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addItem}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1 px-1"
              >
                <Plus className="h-4 w-4" />
                הוסף פריט
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Notes */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>הערות</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הערות נוספות שיופיעו בהצעה..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="w-full sm:w-72 shrink-0">
            <CardHeader>
              <CardTitle>סיכום</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">סכום ביניים</span>
                  <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm text-gray-600 shrink-0">הנחה %</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-20 text-center"
                    dir="ltr"
                  />
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>הנחה</span>
                    <span>-{formatCurrency(discountAmount, currency)}</span>
                  </div>
                )}

                {/* VAT toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">מע&quot;מ ({vatRate}%)</label>
                  <button
                    onClick={() => setIncludeVat(!includeVat)}
                    className={`w-10 h-5 rounded-full transition-colors ${includeVat ? 'bg-indigo-600' : 'bg-gray-300'} relative`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${includeVat ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                {includeVat && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>מע&quot;מ</span>
                    <span>{formatCurrency(vatAmount, currency)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">סה&quot;כ לתשלום</span>
                  <span className="font-bold text-lg text-indigo-600">{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
