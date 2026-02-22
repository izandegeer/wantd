'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Category } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryBadge } from './CategoryBadge'
import { Plus } from 'lucide-react'

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface CategoryPickerProps {
  value: string | null
  onChange: (categoryId: string | null) => void
  categories: Category[]
  onCategoryCreated: (category: Category) => void
}

export function CategoryPicker({ value, onChange, categories, onCategoryCreated }: CategoryPickerProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🎁')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), icon: newIcon, color: newColor }),
      })
      if (!res.ok) throw new Error('Error al crear categoría')
      const category: Category = await res.json()
      onCategoryCreated(category)
      onChange(category.id)
      setShowCreate(false)
      setNewName('')
      toast.success('Categoría creada')
    } catch {
      toast.error('Error al crear la categoría')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            value === null
              ? 'bg-foreground text-background border-foreground'
              : 'bg-background text-muted-foreground border-border hover:border-foreground'
          }`}
        >
          Sin categoría
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`rounded-full border-2 transition-all ${
              value === cat.id ? 'ring-2 ring-offset-2 ring-foreground ring-offset-background' : ''
            }`}
            style={{ borderColor: value === cat.id ? cat.color : 'transparent' }}
          >
            <CategoryBadge category={cat} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          Nueva
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border bg-muted/50 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Nombre</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ej. Videojuegos"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Emoji</Label>
              <Input
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="h-8 w-16 text-center text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Color</Label>
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    newColor === color ? 'scale-125 ring-2 ring-offset-1 ring-offset-background ring-foreground/50' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? 'Creando...' : 'Crear'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
