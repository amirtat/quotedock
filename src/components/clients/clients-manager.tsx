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
import { useT } from '@/lib/lang-context'

interface ClientsManagerProps {
  initialClients: Client[]
  userId: string
}

const emptyForm = { name: '', email: '', phone: '', company: '', address: '' }

export function ClientsManager({ initialClients, userId }: ClientsManagerProps) {
  const T = useT()
  const [clients, setClients] = useState(initialClients)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setError(null)
    const supabase = createClient()

    if (editing) {
      const { data, error: err } = await supabase.from('clients').update(form).eq('id', editing.id).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      if (data) setClients((prev) => prev.map((c) => (c.id === editing.id ? data : c)))
    } else {
      const { data, error: err } = await supabase.from('clients').insert({ ...form, user_id: userId }).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      if (data) setClients((prev) => [...prev, data])
    }

    setSaving(false)
    setOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm(T.confirm_delete)) return
    const supabase = createClient()
    await supabase.from('clients').delete().eq('id', id)
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{T.clients}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} {T.clients}</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          {T.add_client}
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-700 mb-2">{T.no_clients}</h2>
          <p className="text-gray-500 text-sm mb-6">{T.no_clients_desc}</p>
          <Button onClick={openNew}>{T.add_client}</Button>
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
            <DialogTitle>{editing ? T.edit_client : T.add_client}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{T.client_name} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{T.client_email}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" dir="ltr" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{T.client_phone}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="050-0000000" dir="ltr" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{T.client_company}</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{T.client_address}</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{T.cancel}</Button>
              <Button onClick={handleSave} loading={saving}>{T.save}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
