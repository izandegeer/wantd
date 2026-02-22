import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Gift, Heart, Share2, Star } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Star className="h-4 w-4" />
            Tus deseos, organizados
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground">
            Crea listas de deseos que{' '}
            <span className="text-primary">inspiran</span>
          </h1>
          <p className="mb-10 text-xl text-muted-foreground">
            Organiza lo que quieres por categorías, comparte con familia y amigos,
            y activa el modo sorpresa para que los regalos sean un misterio.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Empezar gratis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 sm:grid-cols-3">
          <div className="rounded-2xl bg-card p-8 shadow-sm border">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <Heart className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Categorías personalizadas</h3>
            <p className="text-muted-foreground">
              Organiza tus deseos con emojis y colores: videojuegos, ropa, libros...
            </p>
          </div>
          <div className="rounded-2xl bg-card p-8 shadow-sm border">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <Share2 className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Compartir por link</h3>
            <p className="text-muted-foreground">
              Genera un link único para compartir tu lista sin que nadie necesite cuenta.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-8 shadow-sm border">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
              <Gift className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Modo sorpresa</h3>
            <p className="text-muted-foreground">
              Activa el modo sorpresa y tus amigos podrán reservar regalos sin que lo sepas.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
