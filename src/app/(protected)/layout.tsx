import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Sidebar } from '@/components/shared/Sidebar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  let profile = null

  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      profile = profileData
    }
  } catch {
    redirect('/login')
  }

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} profile={profile} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
