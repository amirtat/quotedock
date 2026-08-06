import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/settings-form'
import { NoteTemplatesManager } from '@/components/settings/note-templates-manager'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: noteTemplates }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('note_templates').select('*').eq('user_id', user.id).order('sort_order'),
  ])

  return (
    <div>
      <SettingsForm profile={profile} userId={user.id} />
      <div className="p-6 max-w-2xl mx-auto pt-0">
        <NoteTemplatesManager initialTemplates={noteTemplates || []} userId={user.id} />
      </div>
    </div>
  )
}
