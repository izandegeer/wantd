'use client'

import Image from 'next/image'
import { toast } from 'sonner'
import type { WishlistItem } from '@/lib/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/categories/CategoryBadge'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'

const PRIORITY_LABELS = { 0: 'Baja', 1: 'Media', 2: 'Alta' }
const PRIORITY_VARIANTS = {
  0: 'secondary' as const,
  1: 'outline' as const,
  2: 'default' as const,
}
const STATUS_LABELS = {
  available: 'Disponible',
  reserved: 'Reservado',
  purchased: 'Comprado',
}
const STATUS_COLORS = {
  available: 'bg-green-500/10 text-green-500 border-green-500/20',
  reserved: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  purchased: 'bg-muted text-muted-foreground border-border',
}

interface ItemCardProps {
  item: WishlistItem
  wishlistId: string
  onEdit: (item: WishlistItem) => void
  onDelete: (itemId: string) => void
}

export function ItemCard({ item, wishlistId, onEdit, onDelete }: ItemCardProps) {
  async function handleDelete() {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return

    const res = await fetch(
      `/api/wishlists/${wishlistId}/items?itemId=${item.id}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      toast.success('Item eliminado')
      onDelete(item.id)
    } else {
      toast.error('Error al eliminar')
    }
  }

  return (
    <Card className={`group transition-all ${item.status === 'purchased' ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {item.image_url && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-medium text-sm ${item.status === 'purchased' ? 'line-through text-muted-foreground' : ''}`}>
                {item.name}
              </h4>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {item.price != null && (
                <span className="text-sm font-semibold">
                  {item.price.toFixed(2)} {item.currency}
                </span>
              )}
              <Badge variant={PRIORITY_VARIANTS[item.priority]} className="text-xs py-0">
                {PRIORITY_LABELS[item.priority]}
              </Badge>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[item.status]}`}>
                {STATUS_LABELS[item.status]}
              </span>
              {item.categories && (
                <CategoryBadge category={item.categories} />
              )}
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
