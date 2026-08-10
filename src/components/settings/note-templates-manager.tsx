'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NoteTemplate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useT } from '@/lib/lang-context'

interface NoteTemplatesManagerProps {
  initialTemplates: NoteTemplate[]
  userId: string
}

const emptyForm = { title: '', content: '' }

export function NoteTemplatesManager({ initialTemplates, userId }: NoteTemplatesManagerProps) {
  const T = useT()
  const [templates, setTemplates] = useState(initialTemplates)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<NoteTemplate | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(tpl: NoteTemplate) {
    setEditing(tpl)
    setForm({ title: tpl.title, content: tpl.content })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    setError(null)
    const supabase = createClient()

    if (editing) {
      const { data, error: err } = await supabase
        .from('note_templates')
        .update({ title: form.title, content: form.content })
        .eq('id', editing.id)
        .select()
        .single()
      if (err) { setError(err.message); setSaving(false); return }
      if (data) setTemplates(prev => prev.map(t => t.id === editing.id ? data : t))
    } else {
      const { data, error: err } = await supabase
        .from('note_templates')
        .insert({ ...form, user_id: userId, sort_order: templates.length })
        .select()
        .single()
      if (err) { setError(err.message); setSaving(false); return }
      if (data) setTemplates(prev => [...prev, data])
    }

    setSaving(false)
    setOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm(T.confirm_delete)) return
    const supabase = createClient()
    await supabase.from('note_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{T.note_templates_subtitle}</p>
          <p className="text-xs text-gray-500 mt-0.5">{T.note_templates_hint}</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" />
          {T.add}
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{T.no_note_templates}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map(tpl => (
            <Card key={tpl.id}>
              <CardContent className="p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{tpl.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tpl.content}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(tpl)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(tpl.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? T.note_template_edit : T.note_template_new}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{T.note_template_title_label}</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{T.content}</Label>
              <Textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                rows={4}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{T.cancel}</Button>
              <Button onClick={handleSave} loading={saving}>{T.save}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
