'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import type { Wishlist } from '@/lib/types/database'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Gift, Share2, Trash2 } from 'lucide-react'

interface WishlistCardProps {
  wishlist: Wishlist & {
    wishlist_items: { count: number }[]
    shared_wishlists: { share_token: string; is_active: boolean }[]
  }
  onDelete: (id: string) => void
  onShare: (wishlistId: string) => void
}

export function WishlistCard({ wishlist, onDelete, onShare }: WishlistCardProps) {
  const itemCount = wishlist.wishlist_items?.[0]?.count ?? 0
  const activeShare = wishlist.shared_wishlists?.find(s => s.is_active)

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${wishlist.name}"? Esta acción no se puede deshacer.`)) return

    const res = await fetch(`/api/wishlists/${wishlist.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Lista eliminada')
      onDelete(wishlist.id)
    } else {
      toast.error('Error al eliminar')
    }
  }

  function handleCopyLink() {
    if (activeShare) {
      const url = `${window.location.origin}/share/${activeShare.share_token}`
      navigator.clipboard.writeText(url)
      toast.success('Link copiado al portapapeles')
    } else {
      onShare(wishlist.id)
    }
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{wishlist.name}</h3>
            {wishlist.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {wishlist.description}
              </p>
            )}
          </div>
          {wishlist.surprise_mode && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              🎁 Sorpresa
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Gift className="h-4 w-4" />
            <span>{itemCount} {itemCount === 1 ? 'deseo' : 'deseos'}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
              <Link href={`/lists/${wishlist.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCopyLink}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {activeShare && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 rounded px-2 py-1">
            <Share2 className="h-3 w-3" />
            Link público activo
          </div>
        )}
      </CardContent>
    </Card>
  )
}
