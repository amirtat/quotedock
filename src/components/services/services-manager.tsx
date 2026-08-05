'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { Briefcase, Plus, Pencil, Trash2 } from 'lucide-react'

const UNITS = [
  { value: 'unit', label: 'יחידה' },
  { value: 'hour', label: 'שעה' },
  { value: 'day', label: 'יום' },
  { value: 'month', label: 'חודש' },
  { value: 'project', label: 'פרויקט' },
]

interface ServicesManagerProps {
  initialServices: Service[]
  userId: string
  currency: string
}

const emptyForm = { name: '', description: '', unit_price: 0, unit: 'unit' }

export function ServicesManager({ initialServices, userId, currency }: ServicesManagerProps) {
  const [services, setServices] = useState(initialServices)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(service: Service) {
    setEditing(service)
    setForm({ name: service.name, description: service.description || '', unit_price: service.unit_price, unit: service.unit })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    const supabase = createClient()

    if (editing) {
      const { data, error: err } = await supabase.from('services').update(form).eq('id', editing.id).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      if (data) setServices((prev) => prev.map((s) => (s.id === editing.id ? data : s)))
    } else {
      const { data, error: err } = await supabase.from('services').insert({ ...form, user_id: userId }).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      if (data) setServices((prev) => [...prev, data])
    }

    setSaving(false)
    setOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק שירות זה?')) return
    const supabase = createClient()
    await supabase.from('services').delete().eq('id', id)
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  const unitLabel = (unit: string) => UNITS.find((u) => u.value === unit)?.label || unit

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">קטלוג שירותים</h1>
          <p className="text-sm text-gray-500 mt-0.5">שירותים שניתן לשים בהצעות מחיר</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          הוסף שירות
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-700 mb-2">אין שירותים בקטלוג</h2>
          <p className="text-gray-500 text-sm mb-6">הוסף שירותים שחוזרים על עצמם לשימוש מהיר בהצעות</p>
          <Button onClick={openNew}>הוסף שירות ראשון</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(service)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(service.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {service.description && (
                  <p className="text-xs text-gray-500 mb-3">{service.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">לכל {unitLabel(service.unit)}</span>
                  <span className="font-bold text-indigo-600">{formatCurrency(service.unit_price, currency)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת שירות' : 'שירות חדש'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>שם שירות *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="עיצוב לוגו" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>תיאור</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="תיאור קצר של השירות..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>מחיר</Label>
                <Input type="number" min="0" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })} dir="ltr" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>יחידה</Label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
              <Button onClick={handleSave} loading={saving}>שמור</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
