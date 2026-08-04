'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

interface SettingsFormProps {
  profile: Profile | null
  userId: string
}

export function SettingsForm({ profile, userId }: SettingsFormProps) {
  const [form, setForm] = useState({
    business_name: profile?.business_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    vat_rate: profile?.vat_rate ?? 18,
    currency: profile?.currency || 'ILS',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update(form).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>שמור הגדרות</Button>
          {saved && <span className="text-sm text-green-600 font-medium">נשמר בהצלחה ✓</span>}
        </div>
      </form>
    </div>
  )
}
