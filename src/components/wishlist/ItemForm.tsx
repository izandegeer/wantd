'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { WishlistItem, Category } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryPicker } from '@/components/categories/CategoryPicker'
import { Loader2 } from 'lucide-react'

const itemSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().optional(),
  image_url: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
  price: z.coerce.number().positive('Debe ser positivo').optional().or(z.literal('')),
  currency: z.string().length(3).default('EUR'),
  external_link: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
  priority: z.coerce.number().int().min(0).max(2).default(1),
  notes: z.string().optional(),
})

type ItemFormValues = z.infer<typeof itemSchema>

interface ItemFormProps {
  wishlistId: string
  item?: WishlistItem | null
  categories: Category[]
  selectedCategoryId: string | null
  onCategoryChange: (id: string | null) => void
  onCategoryCreated: (cat: Category) => void
  onSuccess: (item: WishlistItem) => void
  onCancel: () => void
}

export function ItemForm({
  wishlistId,
  item,
  categories,
  selectedCategoryId,
  onCategoryChange,
  onCategoryCreated,
  onSuccess,
  onCancel,
}: ItemFormProps) {
  const isEditing = !!item

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      description: '',
      image_url: '',
      price: '',
      currency: 'EUR',
      external_link: '',
      priority: 1,
      notes: '',
    },
  })

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        description: item.description ?? '',
        image_url: item.image_url ?? '',
        price: item.price ?? '',
        currency: item.currency,
        external_link: item.external_link ?? '',
        priority: item.priority,
        notes: item.notes ?? '',
      })
    }
  }, [item, reset])

  async function onSubmit(values: ItemFormValues) {
    const payload = {
      ...values,
      price: values.price === '' ? null : Number(values.price),
      image_url: values.image_url === '' ? null : values.image_url,
      external_link: values.external_link === '' ? null : values.external_link,
      description: values.description || null,
      notes: values.notes || null,
      category_id: selectedCategoryId,
      priority: Number(values.priority) as 0 | 1 | 2,
    }

    if (isEditing && item) {
      const res = await fetch(`/api/wishlists/${wishlistId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, ...payload }),
      })
      if (!res.ok) {
        toast.error('Error al actualizar el item')
        return
      }
      const updated: WishlistItem = await res.json()
      toast.success('Item actualizado')
      onSuccess(updated)
    } else {
      const res = await fetch(`/api/wishlists/${wishlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        toast.error('Error al crear el item')
        return
      }
      const created: WishlistItem = await res.json()
      toast.success('Item añadido')
      onSuccess(created)
      reset()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" placeholder="ej. PS5" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" placeholder="Descripción opcional..." {...register('description')} className="resize-none" rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input id="price" type="number" step="0.01" placeholder="0.00" {...register('price')} />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Input id="currency" placeholder="EUR" maxLength={3} {...register('currency')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="external_link">Link del producto</Label>
        <Input id="external_link" type="url" placeholder="https://..." {...register('external_link')} />
        {errors.external_link && <p className="text-sm text-destructive">{errors.external_link.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">URL de imagen</Label>
        <Input id="image_url" type="url" placeholder="https://..." {...register('image_url')} />
        {errors.image_url && <p className="text-sm text-destructive">{errors.image_url.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Prioridad</Label>
        <Select
          value={String(watch('priority'))}
          onValueChange={(val) => setValue('priority', Number(val) as 0 | 1 | 2)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">Alta</SelectItem>
            <SelectItem value="1">Media</SelectItem>
            <SelectItem value="0">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Categoría</Label>
        <CategoryPicker
          value={selectedCategoryId}
          onChange={onCategoryChange}
          categories={categories}
          onCategoryCreated={onCategoryCreated}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas privadas</Label>
        <Textarea id="notes" placeholder="Notas solo para ti..." {...register('notes')} className="resize-none" rows={2} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditing ? 'Guardando...' : 'Añadiendo...'}</>
          ) : (
            isEditing ? 'Guardar cambios' : 'Añadir deseo'
          )}
        </Button>
      </div>
    </form>
  )
}
