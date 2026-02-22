import { cn } from '@/lib/utils/cn'
import type { Category } from '@/lib/types/database'

interface CategoryBadgeProps {
  category: Pick<Category, 'name' | 'icon' | 'color'>
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
        className
      )}
      style={{ backgroundColor: category.color }}
    >
      {category.icon && <span>{category.icon}</span>}
      {category.name}
    </span>
  )
}
