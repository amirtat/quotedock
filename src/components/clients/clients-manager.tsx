'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Plus, Pencil, Trash2 } from 'lucide-react'

interface ClientsManagerProps {
  initialClients: Client[]
  userId: string
}

const emptyForm = { name: '', email: '', phone: '', company: '', address: '' }

export function ClientsManager({ initialClients, userId }: ClientsManagerProps) {
  const [clients, setClients] = useState(initialClients)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    setForm({ name: client.name, email: client.email || '', phone: client.phone || '', company: client.company || '', address: client.address || '' })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()

    if (editing) {
      const { data } = await supabase.from('clients').update(form).eq('id', editing.id).select().single()
      if (data) setClients((prev) => prev.map((c) => (c.id === editing.id ? data : c)))
    } else {
      const { data } = await supabase.from('clients').insert({ ...form, user_id: userId }).select().single()
      if (data) setClients((prev) => [...prev, data])
    }

    setSaving(false)
    setOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק לקוח זה?')) return
    const supabase = createClient()
    await supabase.from('clients').delete().eq('id', id)
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">לקוחות</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} לקוחות</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          הוסף לקוח
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-700 mb-2">אין לקוחות עדיין</h2>
          <p className="text-gray-500 text-sm mb-6">הוסף לקוחות ובחר אותם בהצעות המחיר</p>
          <Button onClick={openNew}>הוסף לקוח ראשון</Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {[client.company, client.email, client.phone].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(client)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת לקוח' : 'לקוח חדש'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>שם לקוח *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ישראל ישראלי" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>אימייל</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" dir="ltr" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>טלפון</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="050-0000000" dir="ltr" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>חברה</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="שם החברה" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>כתובת</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="רחוב, עיר" />
            </div>
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
