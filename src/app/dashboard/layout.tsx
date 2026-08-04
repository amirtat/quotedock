import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <Sidebar
        businessName={profile?.business_name}
        email={profile?.email || user.email}
      />
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="px-6 py-3 border-t border-border text-center">
          <p className="text-xs text-muted/50">Powered by <span className="font-medium text-muted/70">TripleA.I</span></p>
        </footer>
      </main>
    </div>
  )
}
