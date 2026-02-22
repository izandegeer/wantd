'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Wishlist, WishlistItem, Category, SharedWishlist } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ItemCard } from '@/components/wishlist/ItemCard'
import { ItemForm } from '@/components/wishlist/ItemForm'
import { CategoryBadge } from '@/components/categories/CategoryBadge'
import {
  ArrowLeft,
  Copy,
  Gift,
  Link as LinkIcon,
  Loader2,
  Plus,
  Share2,
  Eye,
  EyeOff,
} from 'lucide-react'
import Link from 'next/link'

type WishlistDetail = Wishlist & {
  wishlist_items: WishlistItem[]
  shared_wishlists: SharedWishlist[]
}

export default function WishlistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const wishlistId = params.id as string

  const [wishlist, setWishlist] = useState<WishlistDetail | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [wishlistRes, categoriesRes] = await Promise.all([
      fetch(`/api/wishlists/${wishlistId}`),
      fetch('/api/categories'),
    ])
    if (!wishlistRes.ok) {
      toast.error('Lista no encontrada')
      router.push('/lists')
      return
    }
    const [wishlistData, categoriesData] = await Promise.all([
      wishlistRes.json(),
      categoriesRes.json(),
    ])
    setWishlist(wishlistData)
    setCategories(categoriesData)
    setLoading(false)
  }, [wishlistId, router])

  useEffect(() => { loadData() }, [loadData])

  async function handleToggleSurprise() {
    if (!wishlist) return
    const res = await fetch(`/api/wishlists/${wishlistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surprise_mode: !wishlist.surprise_mode }),
    })
    if (res.ok) {
      const updated = await res.json()
      setWishlist(prev => prev ? { ...prev, surprise_mode: updated.surprise_mode } : null)
      toast.success(updated.surprise_mode ? 'Modo sorpresa activado' : 'Modo sorpresa desactivado')
    }
  }

  async function handleShare() {
    const res = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlist_id: wishlistId }),
    })
    if (res.ok) {
      const share: SharedWishlist = await res.json()
      const url = `${window.location.origin}/share/${share.share_token}`
      navigator.clipboard.writeText(url)
      toast.success('Link creado y copiado al portapapeles')
      setWishlist(prev => prev ? {
        ...prev,
        shared_wishlists: [share, ...prev.shared_wishlists.filter(s => !s.is_active)],
      } : null)
    }
  }

  async function handleDisableShare(shareId: string) {
    await fetch(`/api/shares?id=${shareId}`, { method: 'DELETE' })
    setWishlist(prev => prev ? {
      ...prev,
      shared_wishlists: prev.shared_wishlists.map(s => s.id === shareId ? { ...s, is_active: false } : s),
    } : null)
    toast.success('Link desactivado')
  }

  function handleItemSuccess(item: WishlistItem) {
    setWishlist(prev => {
      if (!prev) return null
      const exists = prev.wishlist_items.find(i => i.id === item.id)
      return {
        ...prev,
        wishlist_items: exists
          ? prev.wishlist_items.map(i => i.id === item.id ? item : i)
          : [item, ...prev.wishlist_items],
      }
    })
    setShowForm(false)
    setEditingItem(null)
    setSelectedCategoryId(null)
  }

  function handleItemDelete(itemId: string) {
    setWishlist(prev => prev ? {
      ...prev,
      wishlist_items: prev.wishlist_items.filter(i => i.id !== itemId),
    } : null)
  }

  function handleEdit(item: WishlistItem) {
    setEditingItem(item)
    setSelectedCategoryId(item.category_id)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!wishlist) return null

  const activeShare = wishlist.shared_wishlists?.find(s => s.is_active)
  const shareUrl = activeShare ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${activeShare.share_token}` : null

  const filteredItems = filterCategory
    ? wishlist.wishlist_items.filter(i => i.category_id === filterCategory)
    : wishlist.wishlist_items

  const usedCategories = categories.filter(c =>
    wishlist.wishlist_items.some(i => i.category_id === c.id)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link href="/lists"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{wishlist.name}</h1>
            {wishlist.surprise_mode && (
              <Badge variant="secondary">🎁 Modo sorpresa</Badge>
            )}
          </div>
          {wishlist.description && (
            <p className="text-muted-foreground mt-1">{wishlist.description}</p>
          )}
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { setEditingItem(null); setSelectedCategoryId(null); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir deseo
        </Button>
        <Button
          variant="outline"
          onClick={handleToggleSurprise}
        >
          {wishlist.surprise_mode ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {wishlist.surprise_mode ? 'Desactivar sorpresa' : 'Activar sorpresa'}
        </Button>
        {activeShare ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
              <LinkIcon className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">Link activo</span>
              <button
                onClick={() => { navigator.clipboard.writeText(shareUrl!); toast.success('Link copiado') }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleDisableShare(activeShare.id)} className="text-destructive hover:text-destructive">
              Desactivar
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartir lista
          </Button>
        )}
      </div>

      {/* Category filter */}
      {usedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filtrar:</span>
          <button
            onClick={() => setFilterCategory(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              filterCategory === null
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:border-foreground'
            }`}
          >
            Todos ({wishlist.wishlist_items.length})
          </button>
          {usedCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
              className={`rounded-full border-2 transition-all ${filterCategory === cat.id ? 'ring-2 ring-offset-1 ring-slate-900' : ''}`}
              style={{ borderColor: filterCategory === cat.id ? cat.color : 'transparent' }}
            >
              <CategoryBadge category={cat} />
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg border-dashed">
          <Gift className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">
            {filterCategory ? 'No hay deseos en esta categoría' : 'No hay deseos todavía'}
          </p>
          {!filterCategory && (
            <Button className="mt-4" onClick={() => { setEditingItem(null); setShowForm(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Añadir primer deseo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              wishlistId={wishlistId}
              onEdit={handleEdit}
              onDelete={handleItemDelete}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingItem(null); setSelectedCategoryId(null) } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar deseo' : 'Añadir nuevo deseo'}</DialogTitle>
          </DialogHeader>
          <ItemForm
            wishlistId={wishlistId}
            item={editingItem}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            onCategoryCreated={(cat) => setCategories(prev => [...prev, cat])}
            onSuccess={handleItemSuccess}
            onCancel={() => { setShowForm(false); setEditingItem(null); setSelectedCategoryId(null) }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
