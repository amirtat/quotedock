'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Paperclip, X, Download, FileText } from 'lucide-react'

interface Attachment {
  id: string
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
}

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function AttachmentsManager({
  quoteId,
  userId,
  initialAttachments = [],
}: {
  quoteId: string
  userId: string
  initialAttachments?: Attachment[]
}) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (inputRef.current) inputRef.current.value = ''

    if (!ALLOWED.includes(file.type)) return setError('קובץ לא נתמך — PDF ותמונות בלבד')
    if (file.size > MAX_SIZE) return setError('קובץ גדול מדי — עד 5MB')

    setError('')
    setUploading(true)
    const supabase = createClient()

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${userId}/${quoteId}/${Date.now()}-${safeName}`

    const { error: upErr } = await supabase.storage.from('quote-attachments').upload(path, file)
    if (upErr) { setError(upErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('quote-attachments').getPublicUrl(path)

    const { data: record } = await supabase
      .from('quote_attachments')
      .insert({ quote_id: quoteId, file_name: file.name, file_url: publicUrl, file_size: file.size, file_type: file.type, sort_order: attachments.length })
      .select()
      .single()

    if (record) setAttachments(prev => [...prev, record])
    setUploading(false)
  }

  async function handleDelete(id: string, fileUrl: string) {
    const supabase = createClient()
    const marker = '/quote-attachments/'
    const idx = fileUrl.indexOf(marker)
    const storagePath = idx !== -1 ? decodeURIComponent(fileUrl.slice(idx + marker.length)) : null

    await Promise.all([
      supabase.from('quote_attachments').delete().eq('id', id),
      storagePath ? supabase.storage.from('quote-attachments').remove([storagePath]) : Promise.resolve(),
    ])
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">מסמכים מצורפים</h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-xs text-saffron hover:text-saffron-600 font-medium transition-colors disabled:opacity-50"
        >
          <Paperclip className="h-3.5 w-3.5" />
          {uploading ? 'מעלה...' : 'צרף קובץ'}
        </button>
        <input ref={inputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleUpload} />
      </div>

      {error && <p className="text-xs text-danger mb-2">{error}</p>}

      {attachments.length === 0 ? (
        <p className="text-xs text-muted/50 text-center py-3">אין מסמכים מצורפים</p>
      ) : (
        <div className="flex flex-col gap-2">
          {attachments.map(att => {
            const isImage = att.file_type?.startsWith('image/')
            return (
              <div key={att.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface/40 border border-border/60">
                {isImage ? (
                  <img src={att.file_url} alt={att.file_name} className="h-10 w-10 object-cover rounded shrink-0" />
                ) : (
                  <div className="h-10 w-10 bg-red-50 rounded flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-red-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{att.file_name}</p>
                  {att.file_size && <p className="text-xs text-muted">{formatSize(att.file_size)}</p>}
                </div>
                <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="p-1 text-muted/50 hover:text-ink transition-colors">
                  <Download className="h-4 w-4" />
                </a>
                <button onClick={() => handleDelete(att.id, att.file_url)} className="p-1 text-muted/50 hover:text-danger transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
