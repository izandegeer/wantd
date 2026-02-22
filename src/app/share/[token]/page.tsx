'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { PublicWishlist, PublicItem } from '@/lib/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CategoryBadge } from '@/components/categories/CategoryBadge'
import {
  ExternalLink,
  Gift,
  Loader2,
  Lock,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

const PRIORITY_LABELS = { 0: 'Baja', 1: 'Media', 2: 'Alta' }

export default function SharePage() {
  const params = useParams()
  const token = params.token as string

  const [wishlist, setWishlist] = useState<PublicWishlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [reserving, setReserving] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null)
    })

    fetch(`/api/shares/${token}`)
      .then(r => {
        if (!r.ok) return r.json().then(d => Promise.reject(d.error))
        return r.json()
      })
      .then(data => { setWishlist(data); setLoading(false) })
      .catch(err => { setError(err || 'Error al cargar la lista'); setLoading(false) })
  }, [token])

  async function handleReserve(itemId: string) {
    if (!currentUserId) {
      toast.error('Debes iniciar sesión para reservar')
      return
    }
    setReserving(itemId)
    const res = await fetch(`/api/shares/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, action: 'reserve' }),
    })
    if (res.ok) {
      setWishlist(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { ...i, status: 'reserved' as const } : i),
      } : null)
      toast.success(wishlist?.surprise_mode ? '¡Reservado!' : 'Item reservado. ¡Será una sorpresa!')
    } else {
      toast.error('No se pudo reservar. Quizás alguien ya lo reservó.')
    }
    setReserving(null)
  }

  async function handleUnreserve(itemId: string) {
    setReserving(itemId)
    const res = await fetch(`/api/shares/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, action: 'unreserve' }),
    })
    if (res.ok) {
      setWishlist(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { ...i, status: 'available' as const } : i),
      } : null)
      toast.success('Reserva cancelada')
    } else {
      toast.error('No se pudo cancelar la reserva')
    }
    setReserving(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !wishlist) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Lista no disponible</h1>
          <p className="text-muted-foreground">{error ?? 'Este link no existe o ha expirado'}</p>
        </div>
      </div>
    )
  }

  const owner = wishlist.owner
  const initials = owner.full_name
    ? owner.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : owner.username[0].toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Logo size="sm" />
          {wishlist.surprise_mode && (
            <Badge variant="secondary" className="ml-2">
              <Lock className="mr-1 h-3 w-3" />
              Modo sorpresa
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Owner info */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-14 w-14">
            <AvatarImage src={owner.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{wishlist.name}</h1>
            <p className="text-muted-foreground">
              Lista de {owner.full_name ?? owner.username} (@{owner.username})
            </p>
            {wishlist.description && (
              <p className="text-sm text-muted-foreground mt-1">{wishlist.description}</p>
            )}
          </div>
        </div>

        {wishlist.surprise_mode && (
          <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-amber-500 text-sm">
            <strong>Modo sorpresa activo:</strong> puedes reservar items para regalar. El propietario no verá quién ha reservado qué.
          </div>
        )}

        {!currentUserId && (
          <div className="mb-6 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-blue-400 text-sm">
            <a href="/login" className="font-medium underline">Inicia sesión</a> para poder reservar items de esta lista.
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          {wishlist.items.length === 0 ? (
            <div className="text-center py-16">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Esta lista está vacía</p>
            </div>
          ) : (
            wishlist.items.map(item => (
              <ShareItemCard
                key={item.id}
                item={item}
                surpriseMode={wishlist.surprise_mode}
                currentUserId={currentUserId}
                isReserving={reserving === item.id}
                onReserve={handleReserve}
                onUnreserve={handleUnreserve}
              />
            ))
          )}
        </div>
      </main>
    </div>
  )
}

function ShareItemCard({
  item,
  surpriseMode,
  currentUserId,
  isReserving,
  onReserve,
  onUnreserve,
}: {
  item: PublicItem
  surpriseMode: boolean
  currentUserId: string | null
  isReserving: boolean
  onReserve: (id: string) => void
  onUnreserve: (id: string) => void
}) {
  const isAvailable = item.status === 'available'
  const isReserved = item.status === 'reserved'
  const isPurchased = item.status === 'purchased'

  return (
    <Card className={isPurchased ? 'opacity-50' : ''}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {item.image_url && (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={item.image_url} alt={item.name} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className={`font-semibold ${isPurchased ? 'line-through text-muted-foreground' : ''}`}>
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                )}
              </div>
              {item.price != null && (
                <span className="text-sm font-bold shrink-0">{item.price.toFixed(2)} {item.currency}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <Badge variant="outline" className="text-xs">
                Prioridad: {PRIORITY_LABELS[item.priority]}
              </Badge>
              {item.category && <CategoryBadge category={item.category} />}
              {item.external_link && (
                <a
                  href={item.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver producto
                </a>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isAvailable ? 'bg-green-500/10 text-green-500' :
                isReserved ? 'bg-amber-500/10 text-amber-500' :
                'bg-muted text-muted-foreground'
              }`}>
                {isAvailable ? 'Disponible' : isReserved ? 'Reservado' : 'Comprado'}
              </span>

              {currentUserId && isAvailable && (
                <Button
                  size="sm"
                  onClick={() => onReserve(item.id)}
                  disabled={isReserving}
                >
                  {isReserving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reservar'}
                </Button>
              )}
              {currentUserId && isReserved && !surpriseMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUnreserve(item.id)}
                  disabled={isReserving}
                >
                  {isReserving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancelar reserva'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
