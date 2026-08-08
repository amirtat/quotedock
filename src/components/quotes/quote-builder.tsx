'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, calcTotal, intervalLabel } from '@/lib/utils'
import { useT, useLang } from '@/lib/lang-context'
import { Client, QuoteItem, Quote, Service, NoteTemplate, RecurringInterval, PaymentMilestone, QuoteAttachment, QuoteSection } from '@/lib/types'
import ShareDialog from '@/components/quotes/share-dialog'
import { Plus, Trash2, Save, Send, Eye, ArrowLeft, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { deleteQuote } from '@/app/actions/quote-actions'
import AttachmentsManager from '@/components/quotes/attachments-manager'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  initialMilestones?: PaymentMilestone[]
  initialAttachments?: QuoteAttachment[]
  initialSections?: QuoteSection[]
  showQuantityDefault?: boolean
  shareMessageTemplate?: string | null
}

type ItemRow = Omit<QuoteItem, 'id' | 'quote_id'> & { id?: string; _key: string }

function emptyItem(sortOrder: number): ItemRow {
  return { _key: crypto.randomUUID(), service_id: null, name: '', description: '', quantity: 1, unit_price: 0, sort_order: sortOrder, item_type: 'one_time', recurring_interval: null, discount_percent: 0, is_optional: false }
}

function SortableItemRow({ id, children }: { id: string; children: (dragHandle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }
  const dragHandle = (
    <div
      {...attributes}
      {...listeners}
      className="w-5 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted/30 hover:text-muted/60 transition-colors pt-1 touch-none"
    >
      <GripVertical className="h-4 w-4" />
    </div>
  )
  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  )
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
  noteTemplates = [],
  initialMilestones = [],
  initialAttachments = [],
  initialSections = [],
  showQuantityDefault = false,
  shareMessageTemplate,
}: QuoteBuilderProps) {
  const T = useT()
  const lang = useLang()
  const router = useRouter()
  const [deleting, startDelete] = useTransition()
  const [saving, setSaving] = useState(false)
  const isDraft = !initialData?.status || initialData.status === 'draft'
  const [editingLocked, setEditingLocked] = useState(!isDraft)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const [title, setTitle] = useState(initialData?.title || '')
  const [clientId, setClientId] = useState(initialData?.client_id || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  type SectionRow = { _key: string; id?: string; title: string; content: string; position: 'start' | 'end' }
  const [sections, setSections] = useState<SectionRow[]>(() => {
    if (initialSections.length > 0) {
      return initialSections.map(s => ({ _key: s.id, id: s.id, title: s.title, content: s.content, position: s.position || 'start' }))
    }
    const oldPreamble = (initialData as any)?.preamble
    if (oldPreamble) {
      return [{ _key: crypto.randomUUID(), title: T.preamble, content: oldPreamble, position: 'start' as const }]
    }
    return []
  })
  const [showQuantity, setShowQuantity] = useState((initialData as any)?.show_quantity ?? showQuantityDefault)
  const [validUntil, setValidUntil] = useState(initialData?.valid_until || defaultValidUntil || '')
  const [discount, setDiscount] = useState(initialData?.discount || 0)
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(initialData?.discount_type || 'percent')
  const [discountReason, setDiscountReason] = useState(initialData?.discount_reason || '')
  const [includeVat, setIncludeVat] = useState(initialData?.include_vat ?? (vatRate > 0))
  type MilestoneRow = { title: string; percent: number; due_date: string }
  const [milestones, setMilestones] = useState<MilestoneRow[]>(
    initialMilestones.map(m => ({ title: m.title, percent: m.percent, due_date: m.due_date || '' }))
  )

  const [items, setItems] = useState<ItemRow[]>(
    initialItems.length > 0
      ? initialItems.map(i => ({ ...i, _key: i.id || crypto.randomUUID() }))
      : [emptyItem(0)]
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItems(prev => {
      const oldIndex = prev.findIndex(i => i._key === active.id)
      const newIndex = prev.findIndex(i => i._key === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }
  const [quoteId, setQuoteId] = useState(initialQuoteId || null)
  const [shareData, setShareData] = useState<{ url: string; quoteId: string } | null>(null)

  const { subtotal, discountAmount, vatAmount, total, recurringSubtotal } = calcTotal(items as unknown as QuoteItem[], discount, vatRate, includeVat, discountType)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function addItem(type: 'one_time' | 'excluded' = 'one_time') {
    setItems(prev => [...prev, { ...emptyItem(prev.length), item_type: type }])
  }

  function removeItem(key: string) {
    setItems(prev => prev.filter(i => i._key !== key))
  }

  function updateItem(key: string, field: string, value: string | number | boolean) {
    setItems(prev => prev.map(item => (item._key === key ? { ...item, [field]: value } : item)))
  }

  function fillFromService(key: string, serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    setItems(prev =>
      prev.map(item =>
        item._key === key ? { ...item, service_id: serviceId, name: service.name, description: service.description || '', unit_price: service.unit_price, discount_percent: 0 } : item
      )
    )
  }

  function applyMilestonePreset(percents: number[], titles: string[]) {
    setMilestones(percents.map((p, i) => ({ title: titles[i], percent: p, due_date: '' })))
  }

  function addSection(position: 'start' | 'end' = 'start') {
    setSections(prev => [...prev, { _key: crypto.randomUUID(), title: '', content: '', position }])
  }
  function removeSection(key: string) {
    setSections(prev => prev.filter(s => s._key !== key))
  }
  function updateSection(key: string, field: 'title' | 'content', value: string) {
    setSections(prev => prev.map(s => s._key === key ? { ...s, [field]: value } : s))
  }
  function handleSectionDragEnd(event: DragEndEvent, position: 'start' | 'end') {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSections(prev => {
      const posItems = prev.filter(s => s.position === position)
      const others = prev.filter(s => s.position !== position)
      const oldIndex = posItems.findIndex(s => s._key === active.id)
      const newIndex = posItems.findIndex(s => s._key === over.id)
      return [...others, ...arrayMove(posItems, oldIndex, newIndex)]
    })
  }

  async function save(status: 'draft' | 'sent' = 'draft') {
    if (!title.trim()) return showToast(T.error_enter_title, 'err')
    if (items.some(i => !i.name.trim())) return showToast(T.error_item_names, 'err')

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
          show_quantity: showQuantity,
          ...(status === 'sent' ? { public_token: crypto.randomUUID(), sent_at: new Date().toISOString() } : {}),
        }).select('id').single()
        if (error) throw error
        currentQuoteId = data.id
        setQuoteId(currentQuoteId)
      } else {
        const existingToken = (initialData as any)?.public_token
        const { error } = await supabase.from('quotes').update({
          title, client_id: clientId || null, notes: notes || null,
          valid_until: validUntil || null, discount, discount_type: discountType,
          discount_reason: discountReason || null, include_vat: includeVat, status,
          show_quantity: showQuantity,
          ...(status === 'sent' ? {
            sent_at: new Date().toISOString(),
            public_token: existingToken || crypto.randomUUID(),
          } : {}),
        }).eq('id', currentQuoteId)
        if (error) throw error
      }

      await supabase.from('quote_items').delete().eq('quote_id', currentQuoteId)
      await supabase.from('quote_items').insert(
        items.map((item, i) => ({
          quote_id: currentQuoteId, service_id: item.service_id || null,
          name: item.name, description: item.description || null,
          quantity: item.item_type === 'excluded' ? 1 : Number(item.quantity),
          unit_price: item.item_type === 'excluded' ? 0 : Number(item.unit_price),
          sort_order: i,
          item_type: item.item_type || 'one_time',
          recurring_interval: item.item_type === 'recurring' ? (item.recurring_interval || 'monthly') : null,
          discount_percent: item.item_type === 'excluded' ? 0 : Number(item.discount_percent || 0),
          is_optional: item.is_optional || false,
        }))
      )

      await supabase.from('payment_milestones').delete().eq('quote_id', currentQuoteId!)
      if (milestones.length > 0) {
        await supabase.from('payment_milestones').insert(
          milestones.map((m, i) => ({
            quote_id: currentQuoteId!,
            title: m.title,
            percent: m.percent,
            due_date: m.due_date || null,
            sort_order: i,
          }))
        )
      }

      // Diff sections: only delete removed ones, upsert the rest
      const originalSectionIds = new Set(initialSections.map(s => s.id))
      const currentSectionIds = new Set(sections.filter(s => s.id).map(s => s.id!))
      const sectionIdsToDelete = [...originalSectionIds].filter(id => !currentSectionIds.has(id))
      if (sectionIdsToDelete.length > 0) {
        await supabase.from('quote_sections').delete().in('id', sectionIdsToDelete)
      }
      if (sections.length > 0) {
        const { error: sectionsErr } = await supabase.from('quote_sections').upsert(
          sections.map((s, i) => ({
            ...(s.id ? { id: s.id } : {}),
            quote_id: currentQuoteId!,
            title: s.title,
            content: s.content,
            position: s.position,
            sort_order: i,
          }))
        )
        if (sectionsErr) throw new Error(`${T.save_error}: ${sectionsErr.message}`)
      }

      if (status === 'sent') {
        const { data: tokenData } = await supabase.from('quotes').select('public_token').eq('id', currentQuoteId!).single()
        const publicUrl = `${window.location.origin}/q/${tokenData?.public_token}`
        setShareData({ url: publicUrl, quoteId: currentQuoteId! })
      } else {
        showToast(T.saved)
        router.push(`/dashboard/quotes/${currentQuoteId}/preview`)
      }
    } catch (err: any) {
      showToast(err?.message || T.save_error, 'err')
    } finally {
      setSaving(false)
    }
  }

  const selectedClient = clients.find(c => c.id === clientId)

  return (
    <>
    {shareData && (
      <ShareDialog
        open={!!shareData}
        quoteId={shareData.quoteId}
        quoteUrl={shareData.url}
        quoteTitle={title}
        clientName={selectedClient?.name}
        clientEmail={selectedClient?.email || undefined}
        messageTemplate={shareMessageTemplate}
        onClose={() => setShareData(null)}
      />
    )}
    <div className="flex flex-col h-screen">
      {/* Sent quote warning banner */}
      {editingLocked && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            {T.quote_sent_warning}
          </p>
          <button
            onClick={() => setEditingLocked(false)}
            className="text-sm font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors"
          >
            {T.edit_anyway}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-1/2 translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${toast.type === 'ok' ? 'bg-obsidian text-white' : 'bg-danger text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-white shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quotes" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {T.quotes}
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="text-sm font-medium text-ink">{title || T.new_quote}</span>
            <span className="text-xs text-muted mr-2 font-mono">{initialData?.number || nextNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {quoteId && (
            <Link href={`/dashboard/quotes/${quoteId}/preview`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
                {T.preview}
              </Button>
            </Link>
          )}
          {quoteId && (
            <button
              onClick={() => {
                if (!confirm(T.confirm_delete_quote)) return
                startDelete(() => deleteQuote(quoteId))
              }}
              disabled={deleting}
              className="flex items-center gap-1 text-sm text-muted hover:text-danger transition-colors disabled:opacity-50 px-2 py-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? T.deleting : T.delete}
            </button>
          )}
          <Button variant="outline" size="sm" onClick={() => save('draft')} loading={saving} disabled={editingLocked}>
            <Save className="h-4 w-4" />
            {T.save_draft}
          </Button>
          <Button size="sm" onClick={() => save('sent')} loading={saving} disabled={editingLocked}>
            <Send className="h-4 w-4" />
            {T.save_send}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className={`flex flex-1 overflow-hidden min-w-0 min-h-0 ${editingLocked ? 'opacity-60 pointer-events-none select-none' : ''}`}>
        {/* Main form */}
        <div className="flex-1 overflow-y-auto bg-surface/40 p-6">
          <div className="max-w-2xl mx-auto flex flex-col gap-5">

            {/* Quote header */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <Label htmlFor="title">{T.quote_title_label} *</Label>
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={T.quote_title_placeholder}
                    className="flex h-10 w-full rounded-lg border-0 bg-transparent px-0 text-xl font-bold text-ink placeholder:text-muted/40 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{T.client}</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder={T.select_client} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{T.no_client}</SelectItem>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="validUntil">{T.valid_until}</Label>
                  <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} dir="ltr" />
                </div>
              </div>
            </div>

            {/* Start sections */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">{T.section_start}</h2>
                <button type="button" onClick={() => addSection('start')} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 pointer-events-auto">
                  <Plus className="h-3.5 w-3.5" /> {T.add_section}
                </button>
              </div>
              {sections.filter(s => s.position === 'start').length === 0 ? (
                <p className="text-sm text-muted text-center py-3">{T.section_start_hint}</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleSectionDragEnd(e, 'start')}>
                  <SortableContext items={sections.filter(s => s.position === 'start').map(s => s._key)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3">
                      {sections.filter(s => s.position === 'start').map((sec) => (
                        <SortableItemRow key={sec._key} id={sec._key}>
                          {(dragHandle) => (
                            <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-gray-50/50">
                              <div className="flex items-center gap-2">
                                {dragHandle}
                                <Input value={sec.title} onChange={(e) => updateSection(sec._key, 'title', e.target.value)} placeholder={T.section_start_title_placeholder} className="flex-1 text-sm font-medium" />
                                <button type="button" onClick={() => removeSection(sec._key)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                              <Textarea value={sec.content} onChange={(e) => updateSection(sec._key, 'content', e.target.value)} placeholder={T.markdown_hint} rows={3} />
                            </div>
                          )}
                        </SortableItemRow>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">{T.items_section}</h2>
                <button
                  type="button"
                  onClick={() => setShowQuantity((p: boolean) => !p)}
                  className="text-xs text-muted hover:text-ink border border-border rounded px-2 py-0.5 transition-colors pointer-events-auto"
                >
                  {showQuantity ? T.hide_quantity_col : T.show_quantity_col}
                </button>
              </div>

              {/* Column headers */}
              <div className="flex gap-2 text-xs text-muted mb-2 px-1">
                <div className="w-5 shrink-0" />
                <div className="flex-1">{T.name_description}</div>
                {showQuantity && <div className="w-20 shrink-0 text-center">{T.quantity}</div>}
                <div className="w-28 shrink-0 text-center">{T.unit_price}</div>
                <div className="w-7 shrink-0" />
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.filter(i => !i.is_optional && i.item_type !== 'excluded').map(i => i._key)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2">
                    {items.filter(i => !i.is_optional && i.item_type !== 'excluded').map((item) => (
                      <SortableItemRow key={item._key} id={item._key}>
                        {(dragHandle) => (
                          <div className="flex gap-2 items-start p-3 rounded-lg bg-surface/60 border border-border/60">
                            {dragHandle}
                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                              <Input
                                value={item.name}
                                list={`services-ac-${item._key}`}
                                onChange={(e) => {
                                  const val = e.target.value
                                  updateItem(item._key, 'name', val)
                                  const matched = services.find(s => s.name === val)
                                  if (matched) fillFromService(item._key, matched.id)
                                }}
                                placeholder={T.item_name}
                              />
                              {services.length > 0 && (
                                <datalist id={`services-ac-${item._key}`}>
                                  {services.map(s => <option key={s.id} value={s.name} />)}
                                </datalist>
                              )}
                              <Input value={item.description || ''} onChange={(e) => updateItem(item._key, 'description', e.target.value)} placeholder={T.description_optional} className="text-xs" />
                              <div className="flex items-center gap-1 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => updateItem(item._key, 'item_type', 'one_time')}
                                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${item.item_type === 'one_time' ? 'bg-ink text-white border-ink' : 'text-muted border-border hover:border-ink'}`}
                                >{T.one_time}</button>
                                <button
                                  type="button"
                                  onClick={() => updateItem(item._key, 'item_type', 'recurring')}
                                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${item.item_type === 'recurring' ? 'bg-saffron text-white border-saffron' : 'text-muted border-border hover:border-saffron'}`}
                                >{T.recurring}</button>
                                {item.item_type === 'recurring' && (
                                  <select
                                    value={item.recurring_interval || 'monthly'}
                                    onChange={(e) => updateItem(item._key, 'recurring_interval', e.target.value as RecurringInterval)}
                                    className="text-xs text-saffron bg-transparent border-0 p-0 focus:outline-none cursor-pointer"
                                  >
                                    <option value="monthly">{T.monthly}</option>
                                    <option value="quarterly">{T.quarterly}</option>
                                    <option value="yearly">{T.yearly}</option>
                                  </select>
                                )}
                                <div className="flex items-center gap-1 ms-auto">
                                  <button
                                    type="button"
                                    onClick={() => updateItem(item._key, 'discount_percent', (item.discount_percent || 0) === 100 ? 0 : 100)}
                                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${(item.discount_percent || 0) === 100 ? 'bg-green-100 text-green-700 border-green-200' : 'text-muted border-border hover:border-green-300'}`}
                                  >{T.free}</button>
                                  <button
                                    type="button"
                                    onClick={() => updateItem(item._key, 'is_optional', !item.is_optional)}
                                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${item.is_optional ? 'bg-amber-100 text-amber-700 border-amber-200' : 'text-muted border-border hover:border-amber-300'}`}
                                  >{T.optional}</button>
                                </div>
                              </div>
                            </div>
                            {showQuantity && (
                              <div className="w-20 shrink-0">
                                <Input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(item._key, 'quantity', e.target.value)} className="text-center" dir="ltr" />
                              </div>
                            )}
                            <div className="w-28 shrink-0 flex flex-col gap-1">
                              {(item.discount_percent || 0) === 100 ? (
                                <div className="h-9 flex items-center justify-center text-xs text-green-600 font-medium bg-green-50 border border-green-100 rounded-lg">{T.free}</div>
                              ) : (
                                <>
                                  <Input type="number" min="0" step="0.01" value={item.unit_price || ''} placeholder="0" onChange={(e) => updateItem(item._key, 'unit_price', e.target.value === '' ? 0 : Number(e.target.value))} className="text-center" dir="ltr" />
                                  <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    step="1"
                                    value={(item.discount_percent || 0) > 0 && (item.discount_percent || 0) < 100 ? item.discount_percent : ''}
                                    placeholder={T.item_discount}
                                    onChange={(e) => updateItem(item._key, 'discount_percent', e.target.value === '' ? 0 : Number(e.target.value))}
                                    className="w-full text-center text-xs bg-transparent border border-border/60 rounded px-1 py-0.5 text-muted focus:outline-none focus:border-saffron"
                                    dir="ltr"
                                  />
                                </>
                              )}
                            </div>
                            <div className="w-7 shrink-0 flex items-center justify-center pt-1">
                              <button type="button" onClick={() => removeItem(item._key)} className="p-1 text-muted/50 hover:text-danger transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </SortableItemRow>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex items-center gap-3 mt-4 px-1">
                <button type="button" onClick={() => addItem('one_time')} className="flex items-center gap-1.5 text-sm text-saffron hover:text-saffron-600 font-medium transition-colors">
                  <Plus className="h-4 w-4" />
                  {T.add_item}
                </button>
              </div>

              {/* Excluded items section */}
              {items.some(i => i.item_type === 'excluded') && (
                <div className="mt-5 pt-4 border-t border-dashed border-border">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{T.not_included_section}</p>
                  <div className="flex flex-col gap-2">
                    {items.filter(i => i.item_type === 'excluded').map((item) => (
                      <div key={item._key} className="flex gap-2 items-center p-2.5 rounded-lg bg-red-50/40 border border-red-100/60">
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item._key, 'name', e.target.value)}
                            placeholder={T.excluded_placeholder}
                            className="text-sm"
                          />
                          <Input value={item.description || ''} onChange={(e) => updateItem(item._key, 'description', e.target.value)} placeholder={T.description_optional} className="text-xs" />
                        </div>
                        <button type="button" onClick={() => removeItem(item._key)} className="p-1 text-muted/50 hover:text-danger transition-colors shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button type="button" onClick={() => addItem('excluded')} className="flex items-center gap-1.5 text-xs text-muted hover:text-danger/70 font-medium transition-colors mt-3 px-1">
                <Plus className="h-3.5 w-3.5" />
                {T.add_excluded}
              </button>

              {/* Optional items section */}
              {items.some(i => i.is_optional) && (
                <div className="mt-5 pt-4 border-t border-dashed border-amber-200">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">{T.optional_items}</p>
                  <div className="flex flex-col gap-2">
                    {items.filter(i => i.is_optional).map((item) => (
                      <div key={item._key} className="flex gap-2 items-center p-2.5 rounded-lg bg-amber-50/40 border border-amber-100/60">
                        <div className="flex-1 text-sm font-medium text-gray-700 truncate">{item.name || <span className="text-muted/50">{T.no_name}</span>}</div>
                        {item.item_type === 'recurring' && item.recurring_interval && (
                          <span className="text-xs text-amber-600 shrink-0">{intervalLabel(item.recurring_interval, lang)}</span>
                        )}
                        <button type="button" onClick={() => updateItem(item._key, 'is_optional', false)} className="text-xs text-amber-500 hover:text-amber-700 shrink-0">{T.remove}</button>
                        <button type="button" onClick={() => removeItem(item._key)} className="p-1 text-muted/50 hover:text-danger transition-colors shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment schedule */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">{T.payment_schedule}</h2>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => applyMilestonePreset([50, 50], [T.milestone_upfront, T.milestone_balance])} className="text-xs text-muted hover:text-saffron border border-border rounded px-1.5 py-0.5 transition-colors">50/50</button>
                  <button type="button" onClick={() => applyMilestonePreset([40, 30, 30], [T.milestone_upfront, T.milestone_midway, T.milestone_balance])} className="text-xs text-muted hover:text-saffron border border-border rounded px-1.5 py-0.5 transition-colors">40/30/30</button>
                  <button type="button" onClick={() => setMilestones(p => [...p, { title: '', percent: 0, due_date: '' }])} className="text-xs text-saffron hover:text-saffron-600 font-medium transition-colors">+ {T.add}</button>
                </div>
              </div>

              {milestones.length === 0 ? (
                <p className="text-xs text-muted/50 text-center py-3">{T.no_milestones}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted px-1 mb-1">
                    <div className="col-span-5">{T.milestone_title}</div>
                    <div className="col-span-2 text-center">%</div>
                    <div className="col-span-4 text-center">{T.milestone_due}</div>
                    <div className="col-span-1" />
                  </div>
                  {milestones.map((m, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input value={m.title} onChange={e => setMilestones(p => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder={T.milestone_placeholder} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" min="0" max="100" value={m.percent || ''} onChange={e => setMilestones(p => p.map((x, j) => j === i ? { ...x, percent: Number(e.target.value) } : x))} className="text-center" dir="ltr" />
                      </div>
                      <div className="col-span-4">
                        <Input type="date" value={m.due_date} onChange={e => setMilestones(p => p.map((x, j) => j === i ? { ...x, due_date: e.target.value } : x))} dir="ltr" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button type="button" onClick={() => setMilestones(p => p.filter((_, j) => j !== i))} className="p-1 text-muted/50 hover:text-danger transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {milestones.length > 0 && (
                    <div className="flex justify-end mt-1">
                      {(() => { const sum = milestones.reduce((s, m) => s + m.percent, 0); return sum !== 100 ? <span className="text-xs text-orange-500">{T.total}: {sum}% ({T.total_pct_must_be_100})</span> : <span className="text-xs text-green-600">✓ {T.total}: 100%</span> })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* End sections */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">{T.section_end}</h2>
                <button type="button" onClick={() => addSection('end')} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 pointer-events-auto">
                  <Plus className="h-3.5 w-3.5" /> {T.add_section}
                </button>
              </div>
              {sections.filter(s => s.position === 'end').length === 0 ? (
                <p className="text-sm text-muted text-center py-3">{T.section_end_hint}</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleSectionDragEnd(e, 'end')}>
                  <SortableContext items={sections.filter(s => s.position === 'end').map(s => s._key)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3">
                      {sections.filter(s => s.position === 'end').map((sec) => (
                        <SortableItemRow key={sec._key} id={sec._key}>
                          {(dragHandle) => (
                            <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-gray-50/50">
                              <div className="flex items-center gap-2">
                                {dragHandle}
                                <Input value={sec.title} onChange={(e) => updateSection(sec._key, 'title', e.target.value)} placeholder={T.section_end_title_placeholder} className="flex-1 text-sm font-medium" />
                                <button type="button" onClick={() => removeSection(sec._key)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                              <Textarea value={sec.content} onChange={(e) => updateSection(sec._key, 'content', e.target.value)} placeholder={T.markdown_hint} rows={3} />
                            </div>
                          )}
                        </SortableItemRow>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">{T.notes}</h2>
                {noteTemplates.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const tpl = noteTemplates.find(t => t.id === e.target.value)
                      if (tpl) setNotes(prev => prev ? `${prev}\n\n${tpl.content}` : tpl.content)
                      e.target.value = ''
                    }}
                    className="text-xs text-muted border border-border rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-saffron"
                  >
                    <option value="" disabled>{T.add_fixed_text}</option>
                    {noteTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                )}
              </div>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={T.notes_placeholder} rows={3} />
            </div>

            {/* Attachments */}
            {quoteId ? (
              <AttachmentsManager quoteId={quoteId} userId={userId} initialAttachments={initialAttachments} />
            ) : (
              <div className="bg-white rounded-xl border border-border p-5">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{T.attachments}</h2>
                <p className="text-xs text-muted/50 text-center py-2">{T.save_draft_first}</p>
              </div>
            )}
          </div>
        </div>

        {/* Total panel — the signature element */}
        <div className="w-64 bg-obsidian flex flex-col shrink-0 border-r border-obsidian-800">
          <div className="p-5 border-b border-obsidian-700">
            <p className="text-white/30 text-xs uppercase tracking-wider font-medium">{T.summary}</p>
          </div>

          <div className="flex-1 p-5 flex flex-col gap-3">
            {recurringSubtotal > 0 && (
              <div className="flex flex-col gap-1 pb-3 border-b border-obsidian-700">
                <p className="text-white/30 text-xs uppercase tracking-wider">{T.recurring}</p>
                {(['monthly', 'quarterly', 'yearly'] as const).map(interval => {
                  const intervalItems = (items as unknown as QuoteItem[]).filter(i => i.item_type === 'recurring' && (i.recurring_interval || 'monthly') === interval)
                  const intervalTotal = intervalItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)
                  if (intervalTotal === 0) return null
                  return (
                    <div key={interval} className="flex justify-between text-sm">
                      <span className="text-saffron/70">{intervalLabel(interval, lang)}</span>
                      <span className="text-saffron font-amount">{formatCurrency(intervalTotal, currency)}</span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{T.subtotal}</span>
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
                  <span className="text-white/40 text-sm me-1">{T.discount}</span>
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
                  placeholder={T.discount_reason_placeholder}
                  className="text-xs bg-obsidian-700 text-white/60 border border-obsidian-700 rounded-lg px-2 py-1 focus:outline-none focus:border-saffron placeholder-white/20 w-full"
                />
              )}
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-400/70">{T.discount}{discountReason ? ` (${discountReason})` : ''}</span>
                <span className="text-red-400 font-amount">-{formatCurrency(discountAmount, currency)}</span>
              </div>
            )}

            {/* VAT toggle */}
            {vatRate === 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">{T.vat_exempt}</span>
                <span className="text-white/30 text-xs">{T.small_business_vat}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">{T.vat} {vatRate}%</span>
                  <button
                    onClick={() => setIncludeVat(!includeVat)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${includeVat ? 'bg-saffron' : 'bg-obsidian-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${includeVat ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
                {includeVat && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">{T.vat}</span>
                    <span className="text-white/60 font-amount">{formatCurrency(vatAmount, currency)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Grand total — the cash register moment */}
          <div className="p-5 border-t border-obsidian-700">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-2">{T.grand_total}</p>
            <p className="font-amount text-saffron font-bold leading-none" style={{ fontSize: total >= 100000 ? '1.5rem' : '2rem' }}>
              {formatCurrency(total, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
