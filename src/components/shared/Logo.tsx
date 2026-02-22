import { cn } from '@/lib/utils/cn'

interface LogoProps {
  className?: string
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
}

const sizes = {
  sm: { icon: 'h-6 w-6', text: 'text-base' },
  md: { icon: 'h-8 w-8', text: 'text-xl' },
  lg: { icon: 'h-10 w-10', text: 'text-2xl' },
}

export function Logo({ className, iconOnly = false, size = 'md', variant = 'dark' }: LogoProps) {
  const s = sizes[size]

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        className={cn(s.icon, 'shrink-0')}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background rounded square */}
        <rect width="40" height="40" rx="10" fill="#0f172a" />
        {/* 4-pointed sparkle */}
        <path
          d="M20 7c.4 7.2 5.8 12.6 13 13c-7.2.4-12.6 5.8-13 13c-.4-7.2-5.8-12.6-13-13c7.2-.4 12.6-5.8 13-13z"
          fill="white"
        />
        {/* Small dot center accent */}
        <circle cx="20" cy="20" r="1.5" fill="#0f172a" opacity="0.3" />
      </svg>

      {!iconOnly && (
        <span
          className={cn(
            'font-bold tracking-tight',
            s.text,
            variant === 'dark' ? 'text-foreground' : 'text-white'
          )}
        >
          wantd
        </span>
      )}
    </div>
  )
}
