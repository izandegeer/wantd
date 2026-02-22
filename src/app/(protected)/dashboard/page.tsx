'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WishlistCard } from '@/components/wishlist/WishlistCard'
import { Gift, List, Plus, Share2, Loader2 } from 'lucide-react'
import type { Wishlist } from '@/lib/types/database'

type WishlistWithMeta = Wishlist & {
  wishlist_items: { count: number }[]
  shared_wishlists: { share_token: string; is_active: boolean }[]
}

export default function DashboardPage() {
  const [wishlists, setWishlists] = useState<WishlistWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wishlists')
      .then(r => r.json())
      .then(data => {
        setWishlists(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleShare(wishlistId: string) {
    const res = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlist_id: wishlistId }),
    })
    if (res.ok) {
      const share = await res.json()
      const url = `${window.location.origin}/share/${share.share_token}`
      navigator.clipboard.writeText(url)
      toast.success('Link de compartición copiado')
      // Refrescar
      fetch('/api/wishlists').then(r => r.json()).then(setWishlists)
    }
  }

  function handleDelete(id: string) {
    setWishlists(prev => prev.filter(w => w.id !== id))
  }

  const totalItems = wishlists.reduce((acc, w) => acc + (w.wishlist_items?.[0]?.count ?? 0), 0)
  const sharedCount = wishlists.filter(w => w.shared_wishlists?.some(s => s.is_active)).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Gestiona tus listas de deseos</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wishlists</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '—' : wishlists.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deseos totales</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '—' : totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compartidas</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '—' : sharedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Wishlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Mis listas</h2>
          <Button asChild>
            <Link href="/lists">
              <Plus className="mr-2 h-4 w-4" />
              Nueva lista
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : wishlists.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No tienes wishlists todavía</h3>
              <p className="text-muted-foreground mb-4">Crea tu primera lista y empieza a añadir deseos</p>
              <Button asChild>
                <Link href="/lists">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear mi primera lista
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlists.map(wishlist => (
              <WishlistCard
                key={wishlist.id}
                wishlist={wishlist}
                onDelete={handleDelete}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
