'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, X } from 'lucide-react'

interface SettingsFormProps {
  profile: Profile | null
  userId: string
}

export function SettingsForm({ profile, userId }: SettingsFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    business_name: profile?.business_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    vat_rate: profile?.vat_rate ?? 18,
    currency: profile?.currency || 'ILS',
    quote_number_prefix: profile?.quote_number_prefix || 'QD',
    default_quote_validity_days: profile?.default_quote_validity_days ?? 30,
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(profile?.logo_url || null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('הקובץ גדול מ-2MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setLogoUploading(true)
    setLogoError(null)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/logo.${ext}`
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (error) {
      setLogoError(error.message)
    } else {
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      const url = data.publicUrl
      await supabase.from('profiles').update({ logo_url: url }).eq('id', userId)
      setLogoUrl(url)
    }
    setLogoUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleLogoRemove() {
    const supabase = createClient()
    await supabase.from('profiles').update({ logo_url: null }).eq('id', userId)
    setLogoUrl(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').upsert({ id: userId, ...form })
    setSaving(false)
    if (error) {
      setSaveError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">הגדרות</h1>
        <p className="text-sm text-gray-500 mt-0.5">פרטי העסק שיופיעו בהצעות המחיר</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>פרטי העסק</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Logo upload */}
            <div className="flex flex-col gap-1.5">
              <Label>לוגו העסק</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                    <img src={logoUrl} alt="לוגו" className="w-full h-full object-contain p-1" />
                    <button
                      type="button"
                      onClick={handleLogoRemove}
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 text-gray-300">
                    <Upload className="w-6 h-6" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    loading={logoUploading}
                    className="text-sm"
                  >
                    {logoUrl ? 'החלף לוגו' : 'העלה לוגו'}
                  </Button>
                  <p className="text-xs text-gray-400">PNG, JPG, SVG עד 2MB</p>
                  {logoError && <p className="text-xs text-red-500">{logoError}</p>}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>שם העסק</Label>
              <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="הסטודיו שלי" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>אימייל</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>טלפון</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>כתובת</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="רחוב, עיר" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הגדרות מחירים</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="osek-zair"
                checked={form.vat_rate === 0}
                onCheckedChange={(checked) => setForm({ ...form, vat_rate: checked ? 0 : 18 })}
              />
              <Label htmlFor="osek-zair" className="cursor-pointer font-normal">
                עוסק זעיר (פטור ממע&quot;מ)
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>שיעור מע&quot;מ (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.vat_rate}
                  onChange={(e) => setForm({ ...form, vat_rate: Number(e.target.value) })}
                  dir="ltr"
                  disabled={form.vat_rate === 0}
                  className={form.vat_rate === 0 ? 'opacity-40' : ''}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>מטבע</Label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ILS">₪ שקל (ILS)</option>
                  <option value="USD">$ דולר (USD)</option>
                  <option value="EUR">€ אירו (EUR)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>קידומת מספר הצעה</Label>
                <p className="text-xs text-gray-400">למשל: QD ← QD-2025-001</p>
                <Input
                  value={form.quote_number_prefix}
                  onChange={(e) => setForm({ ...form, quote_number_prefix: e.target.value })}
                  dir="ltr"
                  maxLength={10}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>תוקף הצעה ברירת מחדל (ימים)</Label>
                <p className="text-xs text-gray-400">מספר הימים עד פקיעת ההצעה</p>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={form.default_quote_validity_days}
                  onChange={(e) => setForm({ ...form, default_quote_validity_days: Number(e.target.value) })}
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>שמור הגדרות</Button>
          {saved && <span className="text-sm text-green-600 font-medium">נשמר בהצלחה ✓</span>}
          {saveError && <span className="text-sm text-red-600">{saveError}</span>}
        </div>
      </form>

    </div>
  )
}
