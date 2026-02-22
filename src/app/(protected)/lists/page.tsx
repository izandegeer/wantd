'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { Wishlist } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { WishlistCard } from '@/components/wishlist/WishlistCard'
import { Gift, Loader2, Plus } from 'lucide-react'

type WishlistWithMeta = Wishlist & {
  wishlist_items: { count: number }[]
  shared_wishlists: { share_token: string; is_active: boolean }[]
}

const createSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().optional(),
  surprise_mode: z.boolean().default(false),
})

type CreateValues = z.infer<typeof createSchema>

export default function ListsPage() {
  const [wishlists, setWishlists] = useState<WishlistWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', description: '', surprise_mode: false },
  })

  useEffect(() => {
    fetch('/api/wishlists')
      .then(r => r.json())
      .then(data => { setWishlists(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function onSubmit(values: CreateValues) {
    const res = await fetch('/api/wishlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      toast.error('Error al crear la lista')
      return
    }
    const newWishlist: WishlistWithMeta = { ...(await res.json()), wishlist_items: [{ count: 0 }], shared_wishlists: [] }
    setWishlists(prev => [newWishlist, ...prev])
    toast.success('Lista creada')
    reset()
    setOpen(false)
  }

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
      fetch('/api/wishlists').then(r => r.json()).then(setWishlists)
    }
  }

  function handleDelete(id: string) {
    setWishlists(prev => prev.filter(w => w.id !== id))
  }

  const surpriseMode = watch('surprise_mode')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Listas</h1>
          <p className="text-muted-foreground mt-1">{wishlists.length} {wishlists.length === 1 ? 'lista' : 'listas'}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva lista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva wishlist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" placeholder="ej. Lista de Navidad" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" placeholder="Descripción opcional..." {...register('description')} className="resize-none" rows={3} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium text-sm">Modo sorpresa</p>
                  <p className="text-xs text-muted-foreground">Los visitantes pueden reservar regalos sin que tú lo sepas</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('surprise_mode', !surpriseMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    surpriseMode ? 'bg-primary' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      surpriseMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false) }}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : 'Crear lista'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
  )
}
