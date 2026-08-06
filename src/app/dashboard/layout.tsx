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
    .select('business_name, email, logo_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <div className="no-print">
        <Sidebar
          businessName={profile?.business_name}
          email={profile?.email || user.email}
          logoUrl={profile?.logo_url}
        />
      </div>
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="no-print px-6 py-3 border-t border-border text-center">
          <p className="text-xs text-muted/50">
            Powered by{' '}
            <a href="http://www.tripleai.co.il" target="_blank" rel="noopener noreferrer" className="font-medium text-muted/70 hover:text-muted/90 transition-colors">
              TripleA.I
            </a>
          </p>
        </footer>
      </main>
    </div>
  )

}
